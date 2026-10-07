import { type Address, type Hex } from 'viem'
import { usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ENS_HOLIDAY_BULK_RENEWAL_ADDRESS } from '@/constants/web3/contracts'
import { ENS_HOLIDAY_RENEWAL_ABI } from '@/constants/abi/ENSHolidayRenewal'
import { ENS_V2_REGISTRAR_ABI } from '@/constants/abi/ENSv2'
import { mainnet } from 'viem/chains'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForSuccess } from '@/utils/web3/safeTransaction'
import { type EnsV2Contracts, ensureAllowance, planRenewals } from '@/utils/web3/ensv2'

const useExtendDomains = () => {
  const getWalletClient = useGetWalletClient()
  const publicClient = usePublicClient({ chainId: mainnet.id })

  const extend = async (names: string[], durations: bigint[], totalPrice: bigint) => {
    try {
      const walletClient = await getWalletClient()

      // Ensure we're on mainnet before executing the transaction
      await ensureChain(walletClient, mainnet.id)

      const tx = await walletClient.writeContract({
        address: ENS_HOLIDAY_BULK_RENEWAL_ADDRESS,
        abi: ENS_HOLIDAY_RENEWAL_ABI,
        functionName: 'bulkRenew',
        args: [names, durations],
        value: totalPrice,
        chain: mainnet,
      })

      return tx
    } catch (e: any) {
      console.error(e)
      return null
    }
  }

  const extendV2 = async (v2: EnsV2Contracts, labels: string[], durations: bigint[], token: Address) => {
    if (!publicClient) throw new Error('Public client not available')
    const walletClient = await getWalletClient()
    await ensureChain(walletClient, mainnet.id)
    const hashes: Hex[] = []
    for (const group of await planRenewals(publicClient, v2, labels, durations, token)) {
      await ensureAllowance(publicClient, walletClient, token, group.address, group.total)
      const hash = await walletClient.writeContract({
        address: group.address,
        abi: ENS_V2_REGISTRAR_ABI,
        functionName: 'renewBatch',
        args: [group.rds, token],
        chain: mainnet,
      })
      await waitForSuccess(publicClient, hash)
      hashes.push(hash)
    }
    return hashes
  }

  return {
    extend,
    extendV2,
  }
}

export default useExtendDomains
