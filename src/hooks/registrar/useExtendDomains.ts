import { useCallback, useMemo } from 'react'
import { Address, createPublicClient, erc20Abi, Hex, http, labelhash, parseAbi } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { BulkRenewalAbi } from '@/constants/web3/abi/BulkRenewalAbi'
import { BaseRegistrarAbi } from '@/constants/web3/abi/BaseRegistrar'
import { BULK_REGISTRAR_ABI } from '@/constants/web3/abi/BulkRegistrar'
import { activeChain } from '@/constants/web3/chain'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { config } from '@/lib/config'
import type { RenewalBatch, RenewalPayment, RenewalStage } from '@/types/renewal'
import { withGasBuffer } from '@/lib/seaport/gas'

const baseRegistrarControllersAbi = parseAbi(['function controllers(address) view returns (bool)'])

const isV1Routed = (v1Bitmap: readonly bigint[], index: number) =>
  ((v1Bitmap[index >> 8] ?? BigInt(0)) >> BigInt(index & 255)) & BigInt(1)

const useExtendDomains = () => {
  const getWalletClient = useGetWalletClient()
  const publicClient = useMemo(() => createPublicClient({ chain: activeChain, transport: http() }), [])

  // The ENSv2 activation proposal removes every legacy controller from the v1 BaseRegistrar and
  // adds ETHRenewerV1. Until then V1 names renew in ETH through BulkRenewal; afterwards only through
  // ETHRenewerV1 (USDC/DAI, via BulkRegistrationV2.multiRenew). ETHRenewerV1 quotes prices either way,
  // so its controller status is what tells the two apart.
  const getV1Payment = useCallback(async (): Promise<RenewalPayment> => {
    const renewer = await publicClient.readContract({
      address: config.ensBulkRegistrar,
      abi: BULK_REGISTRAR_ABI,
      functionName: 'RENEWER_V1',
    })
    const isController = await publicClient.readContract({
      address: config.ensRegistrar,
      abi: baseRegistrarControllersAbi,
      functionName: 'controllers',
      args: [renewer],
    })
    return isController ? 'token' : 'eth'
  }, [publicClient])

  const getRenewalQuote = useCallback(
    async (batch: RenewalBatch, asset: Address) => {
      const labels = batch.entries.map((entry) => entry.label)
      const durations = batch.entries.map((entry) => entry.duration)

      if (!labels.length || durations.some((duration) => duration <= BigInt(0))) {
        throw new Error('Select a positive renewal duration for every name.')
      }

      if (batch.payment === 'eth') {
        if (durations.some((duration) => duration !== durations[0])) {
          throw new Error('V1 names in the same transaction must have the same renewal duration.')
        }

        const available = await publicClient.multicall({
          contracts: labels.map(
            (label) =>
              ({
                address: config.ensRegistrar,
                abi: BaseRegistrarAbi,
                functionName: 'available',
                args: [BigInt(labelhash(label))],
              }) as const
          ),
          allowFailure: false,
        })
        const unavailable = labels.filter((_, index) => available[index])

        if (unavailable.length) {
          throw new Error(
            `Cannot renew ${unavailable.map((label) => `${label}.eth`).join(', ')} on ${activeChain.name}: unregistered or past the renewal grace period.`
          )
        }

        const total = await publicClient.readContract({
          address: config.bulkRenewalContract,
          abi: BulkRenewalAbi,
          functionName: 'rentPrice',
          args: [labels, durations[0]],
        })
        if (total <= BigInt(0)) throw new Error('These V1 names could not be quoted for renewal.')

        return { total, v1Bitmap: [] as readonly bigint[] }
      }

      const [prices, total, v1Bitmap] = await publicClient.readContract({
        address: config.ensBulkRegistrar,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'renewQuote',
        args: [labels, durations, asset],
      })

      // Every name has to go through the renewer its version expects: a V2 name routed to ETHRenewerV1
      // is still on V1, and a V1 name routed to the ETHRegistrar has migrated since it was loaded.
      const misrouted = labels.filter(
        (_, index) => prices[index] && (isV1Routed(v1Bitmap, index) === BigInt(1)) !== (batch.version === 1)
      )
      if (misrouted.length) {
        throw new Error(
          `The ENS version of ${misrouted.map((label) => `${label}.eth`).join(', ')} changed. Refresh your selection before renewing.`
        )
      }

      const unavailable = labels.filter((_, index) => !prices[index])
      if (unavailable.length) {
        throw new Error(
          `Cannot renew ${unavailable.map((label) => `${label}.eth`).join(', ')}. Refresh the name details and try again.`
        )
      }

      return { total, v1Bitmap }
    },
    [publicClient]
  )

  const extend = async (
    batch: RenewalBatch,
    asset: Address,
    onProgress: (stage: RenewalStage, hash: Hex | null) => void
  ): Promise<Hex> => {
    const walletClient = await getWalletClient()
    const quote = await getRenewalQuote(batch, asset)
    const labels = batch.entries.map((entry) => entry.label)
    const durations = batch.entries.map((entry) => entry.duration)

    await ensureChain(walletClient, activeChain.id)

    if (batch.payment === 'eth') {
      onProgress('confirming', null)
      const request = {
        address: config.bulkRenewalContract,
        abi: BulkRenewalAbi,
        functionName: 'renewAll',
        args: [labels, durations[0]],
        value: quote.total,
        account: walletClient.account,
        chain: activeChain,
      } as const

      const gas = await publicClient.estimateContractGas(request)
      return walletClient.writeContract({ ...request, gas: withGasBuffer(gas) })
    }

    const allowanceArgs = {
      address: asset,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [walletClient.account.address, config.ensBulkRegistrar],
    } as const

    if ((await publicClient.readContract(allowanceArgs)) < quote.total) {
      onProgress('approving', null)

      const approvalHash = await walletClient.writeContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'approve',
        args: [config.ensBulkRegistrar, quote.total],
        chain: activeChain,
      })

      onProgress('approving', approvalHash)
      const receipt = await waitForTransaction(publicClient, approvalHash)

      if (receipt.status !== 'success') throw new Error('Payment token approval failed.')
      if ((await publicClient.readContract(allowanceArgs)) < quote.total) {
        throw new Error('Payment token allowance is insufficient.')
      }
    }

    onProgress('confirming', null)
    const request = {
      address: config.ensBulkRegistrar,
      abi: BULK_REGISTRAR_ABI,
      functionName: 'multiRenew',
      args: [labels, durations, quote.v1Bitmap, asset, quote.total],
      account: walletClient.account,
      chain: activeChain,
    } as const

    const gas = await publicClient.estimateContractGas(request)
    return walletClient.writeContract({ ...request, gas: withGasBuffer(gas) })
  }

  return { extend, getRenewalQuote, getV1Payment, publicClient }
}

export default useExtendDomains
