import { useCallback, useMemo } from 'react'
import { Address, createPublicClient, erc20Abi, Hex, http } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { BulkRenewalAbi } from '@/constants/web3/abi/BulkRenewalAbi'
import { BULK_REGISTRAR_ABI } from '@/constants/web3/abi/BulkRegistrar'
import { activeChain } from '@/constants/web3/chain'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { config } from '@/lib/config'
import type { RenewalBatch, RenewalStage } from '@/types/renewal'
import { getRenewalChain } from '@/utils/renewal'

const useExtendDomains = () => {
  const getWalletClient = useGetWalletClient()
  const v1Client = useMemo(() => createPublicClient({ chain: getRenewalChain(1), transport: http() }), [])
  const v2Client = useMemo(() => createPublicClient({ chain: activeChain, transport: http() }), [])
  const getPublicClient = useCallback((version: 1 | 2) => (version === 1 ? v1Client : v2Client), [v1Client, v2Client])

  const getRenewalQuote = useCallback(
    async (batch: RenewalBatch, asset: Address) => {
      const labels = batch.entries.map((entry) => entry.label)
      const durations = batch.entries.map((entry) => entry.duration)
      if (!labels.length || durations.some((duration) => duration <= BigInt(0))) {
        throw new Error('Select a positive renewal duration for every name.')
      }
      const publicClient = getPublicClient(batch.version)

      if (batch.version === 1) {
        if (durations.some((duration) => duration !== durations[0])) {
          throw new Error('V1 names in the same transaction must have the same renewal duration.')
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

      if (v1Bitmap.some((word) => word !== BigInt(0))) {
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
    [getPublicClient]
  )

  const extend = async (
    batch: RenewalBatch,
    asset: Address,
    onProgress: (stage: RenewalStage, hash: Hex | null) => void
  ): Promise<Hex> => {
    const walletClient = await getWalletClient()
    const chain = getRenewalChain(batch.version)
    const publicClient = getPublicClient(batch.version)
    const quote = await getRenewalQuote(batch, asset)
    const labels = batch.entries.map((entry) => entry.label)
    const durations = batch.entries.map((entry) => entry.duration)

    await ensureChain(walletClient, chain.id)

    if (batch.version === 1) {
      onProgress('confirming', null)
      return walletClient.writeContract({
        address: config.bulkRenewalContract,
        abi: BulkRenewalAbi,
        functionName: 'renewAll',
        args: [labels, durations[0]],
        value: quote.total,
        chain,
      })
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
        chain,
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
      chain,
    } as const

    const gas = await publicClient.estimateContractGas(request)
    return walletClient.writeContract({ ...request, gas: (gas * BigInt(125)) / BigInt(100) })
  }

  return { extend, getRenewalQuote, getPublicClient }
}

export default useExtendDomains
