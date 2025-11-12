import { useWalletClient } from 'wagmi'
import { BigNumber } from '@ethersproject/bignumber'

import { BulkRenewalAbi } from '@/constants/abi/BulkRenewalAbi'
import { MarketplaceDomainType } from '@/types/domains'
import { BULK_RENEWAL_CONTRACT_ADDRESS } from '@/constants/web3/contracts'

const useExtendDomains = () => {
  const { data: walletClient } = useWalletClient()

  const extend = async (domains: MarketplaceDomainType[], expireTime: number, price: number) => {
    if (!walletClient) {
      console.error('Wallet not connected')
      return null
    }

    const names = domains.map((domain) => domain.name.replace('.eth', ''))

    const totalPrice = BigNumber.from(Math.ceil(price * 10 ** 6))
      .mul(BigNumber.from(10).pow(12))
      .toBigInt()

    try {
      const tx = await walletClient?.writeContract({
        address: BULK_RENEWAL_CONTRACT_ADDRESS,
        abi: BulkRenewalAbi,
        functionName: 'renewAll',
        args: [names, BigInt(expireTime)],
        value: totalPrice,
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
