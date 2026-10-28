import { useCallback, useMemo } from 'react'
import { Address, createPublicClient, erc20Abi, Hex, http, labelhash, pad, zeroAddress } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { RENEWER_V1_ABI } from '@/constants/web3/abi/ensRenewerV1'
import { BaseRegistrarAbi } from '@/constants/web3/abi/BaseRegistrar'
import { BULK_REGISTRAR_ABI } from '@/constants/web3/abi/BulkRegistrar'
import { activeChain } from '@/constants/web3/chain'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { config } from '@/lib/config'
import type { RenewalBatch, RenewalStage } from '@/types/renewal'
import { withGasBuffer } from '@/lib/seaport/gas'
import { GRAILS_ETH_ROUTER_ABI } from '@/constants/web3/abi/GrailsETHRouter'
import {
  getEthPaymentDeadline,
  getEthRouterAddress,
  getPricingAsset,
  isEthPayment,
  quoteEthForUsdc,
  withEthSlippage,
} from '@/lib/ethPayment'

const useExtendDomains = () => {
  const getWalletClient = useGetWalletClient()
  const publicClient = useMemo(() => createPublicClient({ chain: activeChain, transport: http() }), [])

  const getRenewalQuote = useCallback(
    async (batch: RenewalBatch, asset: Address) => {
      const labels = batch.entries.map((entry) => entry.label)
      const durations = batch.entries.map((entry) => entry.duration)

      if (!labels.length || durations.some((duration) => duration <= BigInt(0))) {
        throw new Error('Select a positive renewal duration for every name.')
      }

      // Paying with ETH, V1 batches also go through the bulk contract (via the router), which routes
      // them to ETHRenewerV1 with v1Bitmap. Otherwise they go to ETHRenewerV1.renewBatch directly.
      if (batch.version === 1 && !isEthPayment(asset)) {
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

        // @ts-expect-error/ignore-auto-reduce-type
        const total = (await Promise.resolve(
          // @ts-expect-error/ignore-auto-reduce-type
          labels.reduce(async (acc, label, i) => {
            const cost = await publicClient.readContract({
              address: config.ensV2RenewerV1,
              abi: RENEWER_V1_ABI,
              functionName: 'getRenewPrice',
              args: [label, durations[i], asset],
            })
            const total = await acc

            return total + cost
          }, BigInt(0))
        )) as bigint

        if (total <= BigInt(0)) throw new Error('These V1 names could not be quoted for renewal.')

        return { total, v1Bitmap: [] as readonly bigint[] }
      }

      const [prices, total, v1Bitmap] = await publicClient.readContract({
        address: config.ensBulkRegistrar,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'renewQuote',
        args: [labels, durations, getPricingAsset(asset)],
      })

      if (batch.version === 2 && v1Bitmap.some((word) => word !== BigInt(0))) {
        throw new Error('A selected name is still on ENS V1. Refresh your selection before renewing.')
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

    if (isEthPayment(asset)) {
      // No approval: the router buys exactly quote.total USDC with ETH and refunds what's unused.
      onProgress('confirming', null)

      const ethQuote = await quoteEthForUsdc(publicClient, quote.total)
      const request = {
        address: getEthRouterAddress(),
        abi: GRAILS_ETH_ROUTER_ABI,
        functionName: 'multiRenewWithETH',
        args: [labels, durations, quote.v1Bitmap, quote.total, getEthPaymentDeadline(), zeroAddress],
        value: withEthSlippage(ethQuote),
        account: walletClient.account,
        chain: activeChain,
      } as const

      const gas = await publicClient.estimateContractGas(request)
      return walletClient.writeContract({ ...request, gas: withGasBuffer(gas) })
    }

    if (batch.version === 1) {
      const allowanceArgs = {
        address: asset,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletClient.account.address, config.ensV2RenewerV1],
      } as const

      if ((await publicClient.readContract(allowanceArgs)) < quote.total) {
        onProgress('approving', null)

        const approvalHash = await walletClient.writeContract({
          address: asset,
          abi: erc20Abi,
          functionName: 'approve',
          args: [config.ensV2RenewerV1, quote.total],
          chain: activeChain,
        })

        onProgress('approving', approvalHash)
        const receipt = await waitForTransaction(publicClient, approvalHash)

        if (receipt.status !== 'success') throw new Error('Payment token approval failed.')
        if ((await publicClient.readContract(allowanceArgs)) < quote.total) {
          throw new Error('Payment token allowance is insufficient.')
        }
      }

      const items = labels.map((label, i) => ({
        label,
        duration: durations[i],
        referrer: pad(config.ensReferrerAddress),
      }))

      onProgress('confirming', null)

      const request = {
        address: config.ensV2RenewerV1,
        abi: RENEWER_V1_ABI,
        functionName: 'renewBatch',
        args: [items, asset],
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

  return { extend, getRenewalQuote, publicClient }
}

export default useExtendDomains
