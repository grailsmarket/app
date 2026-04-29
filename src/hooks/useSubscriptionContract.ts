import { usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { GrailsSubscriptionAbi } from '@/constants/abi/GrailsSubscriptionAbi'
import { GRAILS_SUBSCRIPTION_ADDRESS } from '@/constants/web3/contracts'
import { mainnet } from 'viem/chains'
import { ensureChain } from '@/utils/web3/ensureChain'
import { Address } from 'viem'

const useSubscriptionContract = () => {
  const publicClient = usePublicClient()
  const getWalletClient = useGetWalletClient()

  const getPrice = async (tierId: number, durationDays: number): Promise<bigint> => {
    const result = await publicClient?.readContract({
      address: GRAILS_SUBSCRIPTION_ADDRESS,
      abi: GrailsSubscriptionAbi,
      functionName: 'getPrice',
      args: [BigInt(tierId), BigInt(durationDays)],
    })
    return result as bigint
  }

  const previewUpgrade = async (
    subscriber: Address,
    newTierId: number
  ): Promise<{ newExpiry: bigint; convertedSeconds: bigint }> => {
    const result = (await publicClient?.readContract({
      address: GRAILS_SUBSCRIPTION_ADDRESS,
      abi: GrailsSubscriptionAbi,
      functionName: 'previewUpgrade',
      args: [subscriber, BigInt(newTierId)],
    })) as [bigint, bigint]
    return { newExpiry: result[0], convertedSeconds: result[1] }
  }

  const subscribe = async (tierId: number, durationDays: number, value: bigint): Promise<string | null> => {
    try {
      const walletClient = await getWalletClient()
      await ensureChain(walletClient, mainnet.id)

      const tx = await walletClient.writeContract({
        address: GRAILS_SUBSCRIPTION_ADDRESS,
        abi: GrailsSubscriptionAbi,
        functionName: 'subscribe',
        args: [BigInt(tierId), BigInt(durationDays)],
        value,
        chain: mainnet,
      })
      return tx
    } catch (e: any) {
      console.error(e)
      return null
    }
  }

  const upgrade = async (newTierId: number, extraDays: number, value: bigint): Promise<string | null> => {
    try {
      const walletClient = await getWalletClient()
      await ensureChain(walletClient, mainnet.id)

      const tx = await walletClient.writeContract({
        address: GRAILS_SUBSCRIPTION_ADDRESS,
        abi: GrailsSubscriptionAbi,
        functionName: 'upgrade',
        args: [BigInt(newTierId), BigInt(extraDays)],
        value,
        chain: mainnet,
      })
      return tx
    } catch (e: any) {
      console.error(e)
      return null
    }
  }

  return {
    getPrice,
    previewUpgrade,
    subscribe,
    upgrade,
    publicClient,
  }
}

export default useSubscriptionContract
