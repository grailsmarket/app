'use client'

import React from 'react'
import Link from 'next/link'
import { Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectPortfolioSummaryConfig } from '@/state/reducers/dashboard/selectors'
import { useUserContext } from '@/context/user'
import { getBalances } from '@/api/user/getBalances'
import Price from '@/components/ui/price'
import LoadingCell from '@/components/ui/loadingCell'
import { ETH_ADDRESS, USDC_ADDRESS, WETH_ADDRESS } from '@/constants/web3/tokens'
import { localizeNumber } from '@/utils/localizeNumber'

interface PortfolioSummaryWidgetProps {
  instanceId: string
}

const PortfolioSummaryWidget: React.FC<PortfolioSummaryWidgetProps> = ({ instanceId }) => {
  const config = useAppSelector((state) => selectPortfolioSummaryConfig(state, instanceId))
  const { userAddress, authStatus, watchlist } = useUserContext()

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', userAddress],
    queryFn: async () => {
      if (!userAddress) return null
      return getBalances(userAddress)
    },
    enabled: !!userAddress,
  })

  if (!config) return null

  if (authStatus !== 'authenticated' || !userAddress) {
    return (
      <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
        Sign in to see your portfolio.
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col overflow-y-auto p-3'>
      <div className='grid grid-cols-2 gap-x-3 gap-y-3'>
        <BalanceStat label='ETH' loading={balancesLoading} wei={balances?.['eth']?.wei} address={ETH_ADDRESS} />
        <BalanceStat label='WETH' loading={balancesLoading} wei={balances?.['weth']?.wei} address={WETH_ADDRESS} />
        <BalanceStat label='USDC' loading={balancesLoading} wei={balances?.['usdc']?.wei} address={USDC_ADDRESS} />
        <BalanceStat
          label='ENS'
          loading={balancesLoading}
          wei={balances?.['ens']?.wei}
          address={(balances?.['ens']?.address as Address | null) ?? null}
        />
      </div>
      <div className='border-tertiary mt-3 grid grid-cols-2 gap-x-3 border-t pt-3'>
        <Link
          href={`/profile/${userAddress}?tab=watchlist`}
          className='border-neutral hover:bg-secondary flex flex-col items-start border-l-2 pl-2 transition-colors'
        >
          <span className='text-lg font-semibold'>{localizeNumber(watchlist?.length ?? 0)}</span>
          <span className='text-neutral text-xs'>Watchlist</span>
        </Link>
        <Link
          href={`/profile/${userAddress}`}
          className='border-neutral hover:bg-secondary flex flex-col items-start border-l-2 pl-2 transition-colors'
        >
          <span className='text-primary text-lg font-semibold'>View</span>
          <span className='text-neutral text-xs'>Profile</span>
        </Link>
      </div>
    </div>
  )
}

interface BalanceStatProps {
  label: string
  loading: boolean
  wei: string | undefined
  address: Address | null
}
const BalanceStat: React.FC<BalanceStatProps> = ({ label, loading, wei, address }) => (
  <div className='border-neutral flex flex-col items-start border-l-2 pl-2'>
    {loading ? (
      <LoadingCell height='20px' width='64px' />
    ) : wei && address ? (
      <Price price={wei} currencyAddress={address} iconSize='14px' fontSize='text-lg font-semibold' />
    ) : (
      <p className='text-lg font-semibold'>-</p>
    )}
    <span className='text-neutral text-xs'>{label}</span>
  </div>
)

export default PortfolioSummaryWidget
