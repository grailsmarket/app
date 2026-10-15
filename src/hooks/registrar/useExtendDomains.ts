import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ENS_HOLIDAY_RENEWAL_ABI } from '@/constants/web3/abi/ENSHolidayRenewal'
import { mainnet } from 'viem/chains'
import { ensureChain } from '@/utils/web3/ensureChain'
import { config } from '@/lib/config'

const useExtendDomains = () => {
  const getWalletClient = useGetWalletClient()

  const extend = async (names: string[], durations: bigint[], totalPrice: bigint) => {
    try {
      const walletClient = await getWalletClient()

      // Ensure we're on mainnet before executing the transaction
      await ensureChain(walletClient, mainnet.id)

      const tx = await walletClient.writeContract({
        address: config.bulkRenewalContract,
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

  return {
    extend,
  }
}

export default useExtendDomains
