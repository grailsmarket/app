import { useWalletClient } from 'wagmi'
import { BigNumber } from '@ethersproject/bignumber'

import { getBulkRenewalContract } from '@/app/utils/web3/web3'

import { TransactionBannerStatusType } from '@/app/types/ui'
import { DomainsToExtendType } from '@/app/state/reducers/tabs/manager'

import { YEAR_IN_SECONDS } from '@/app/constants/time'

const useExtendDomain = () => {
  const { data: wallet } = useWalletClient()
  const bulkRenewalContract = getBulkRenewalContract(wallet)

  const extend = async (
    domains: DomainsToExtendType[],
    duration: number,
    price: number,
    onRenewalFinished: (status: TransactionBannerStatusType, errorMsg?: string) => void
  ) => {
    if (!bulkRenewalContract) return

    const names = domains.map((domain) => domain.name.replace('.eth', ''))

    const totalPrice = BigNumber.from(Math.ceil(price * 10 ** 6))
      .mul(BigNumber.from(10).pow(12))
      .toBigInt()

    try {
      await bulkRenewalContract.write.renewAll([names, BigInt(duration * YEAR_IN_SECONDS)], {
        value: totalPrice,
      })

      onRenewalFinished('success')
    } catch (e: any) {
      onRenewalFinished('error', e.message.substring(0, 28) ?? e)
    }
  }

  return {
    extend,
  }
}

export default useExtendDomain
