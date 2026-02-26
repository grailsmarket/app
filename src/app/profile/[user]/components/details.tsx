'use client'

import { getBadges } from '@/api/user/getBadges'
import { getBalances } from '@/api/user/getBalances'
import LoadingCell from '@/components/ui/loadingCell'
import Price from '@/components/ui/price'
import { ETH_ADDRESS, USDC_ADDRESS, WETH_ADDRESS } from '@/constants/web3/tokens'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import { Address, isAddress } from 'viem'
import PrepunkAvatar from 'public/clubs/prepunks/avatar.jpg'
import PrepunkHeader from 'public/clubs/prepunks/header.jpeg'
import Image from 'next/image'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import Link from 'next/link'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { getDetails } from '@/api/user/getDetails'
import EthereumLogo from 'public/icons/eth-gray.svg'
import GrailsIcon from 'public/logo.png'

interface Props {
  user?: Address | string | null
}

const Details: React.FC<Props> = ({ user }) => {
  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['profile', 'details', user],
    queryFn: () => (user && isAddress(user) ? getDetails(user) : null),
    enabled: !!user && isAddress(user),
  })

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['balances', user],
    queryFn: async () => {
      if (!user) return null
      const balances = await getBalances(user as Address)
      return balances
    },
    enabled: !!user,
  })

  const { data: badges, isLoading: badgesLoading } = useQuery({
    queryKey: ['badges', user],
    queryFn: async () => {
      if (!user) return null
      const badges = await getBadges(user as Address)
      return badges
    },
    enabled: !!user,
  })

  return (
    <div className='border-tertiary bg-secondary flex w-full flex-col justify-between gap-2 p-2 sm:gap-4 md:p-4 lg:w-[380px] lg:border-l-2'>
      <div className='flex flex-col gap-3'>
        <h3 className='font-sedan-sc hidden text-3xl lg:block'>Account</h3>
        <div className='grid grid-cols-4 gap-y-4 lg:grid-cols-2'>
          <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
            {balancesLoading ? (
              <LoadingCell height='22px' width='64px' />
            ) : balances?.['eth']?.wei ? (
              <Price
                price={balances?.['eth']?.wei}
                currencyAddress={ETH_ADDRESS}
                iconSize='18px'
                fontSize='text-lg sm:text-xl font-semibold'
                alignTooltip='right'
                tooltipPosition='bottom'
              />
            ) : (
              <p className='text-lg font-semibold sm:text-xl'>-</p>
            )}
            <p className='text-neutral text-lg font-medium'>ETH</p>
          </div>
          <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
            {balancesLoading ? (
              <LoadingCell height='22px' width='64px' />
            ) : balances?.['weth']?.wei ? (
              <Price
                price={balances?.['weth']?.wei}
                currencyAddress={WETH_ADDRESS}
                iconSize='18px'
                fontSize='text-lg sm:text-xl font-semibold'
                alignTooltip='right'
                tooltipPosition='bottom'
              />
            ) : (
              <p className='text-lg font-semibold sm:text-xl'>-</p>
            )}
            <p className='text-neutral text-lg font-medium'>WETH</p>
          </div>
          <div className='border-neutral flex h-fit flex-col items-start truncate border-l-2 pl-1.5 sm:pl-2'>
            {balancesLoading ? (
              <LoadingCell height='22px' width='64px' />
            ) : balances?.['usdc']?.wei ? (
              <Price
                price={balances?.['usdc']?.wei}
                currencyAddress={USDC_ADDRESS}
                iconSize='18px'
                fontSize='text-lg sm:text-xl font-semibold'
                alignTooltip='right'
                tooltipPosition='bottom'
              />
            ) : (
              <p className='text-lg font-semibold sm:text-xl'>-</p>
            )}
            <p className='text-neutral text-lg font-medium'>USDC</p>
          </div>
          <div className='border-neutral flex h-fit flex-col items-start border-l-2 pl-2'>
            {balancesLoading ? (
              <LoadingCell height='22px' width='64px' />
            ) : balances?.['ens']?.wei && balances?.['ens']?.address ? (
              <Price
                price={balances?.['ens']?.wei}
                currencyAddress={balances?.['ens']?.address as Address}
                iconSize='18px'
                fontSize='text-lg sm:text-xl font-semibold'
                alignTooltip='right'
                tooltipPosition='bottom'
              />
            ) : (
              <p className='text-lg font-semibold sm:text-xl'>-</p>
            )}
            <p className='text-neutral text-lg font-medium'>ENS</p>
          </div>
        </div>
      </div>
      <div className='flex flex-col gap-2'>
        <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2'>
          <div className='border-neutral flex h-fit flex-col items-start border-l-2 pl-2'>
            {detailsLoading ? (
              <LoadingCell height='18px' width='64px' />
            ) : (
              <p className='text-lg font-medium'>{details?.lastSeenAt ? formatTimeAgo(details?.lastSeenAt) : '-'}</p>
            )}
            <div className='flex items-center gap-1'>
              <Image src={GrailsIcon} alt='Arrow right' width={12} height={12} />
              <p className='text-neutral text-md font-medium'>Last seen</p>
            </div>
          </div>
          <div className='border-neutral flex h-fit flex-col items-start border-l-2 pl-2'>
            {detailsLoading ? (
              <LoadingCell height='18px' width='64px' />
            ) : (
              <p className='text-lg font-medium'>
                {details?.lastSeenOnchain ? formatTimeAgo(details?.lastSeenOnchain) : '-'}
              </p>
            )}
            <div className='flex items-center gap-1'>
              <Image src={EthereumLogo} alt='Arrow right' width={10} height={10} />
              <p className='text-neutral text-md font-medium'>Last txn</p>
            </div>
          </div>
        </div>
        {badgesLoading ? (
          <LoadingCell height='44px' width='100%' />
        ) : badges?.['prepunk'] ? (
          <Link
            href='/categories/prepunks'
            className='bg-background lg:bg-secondary border-tertiary hover:bg-foreground/20 relative flex w-full items-center gap-2 rounded-md border p-2 transition-colors'
          >
            <Image
              src={PrepunkHeader}
              alt='Prepunks'
              width={390}
              height={390}
              className='absolute top-0 left-0 h-full w-full rounded-md object-cover opacity-10'
            />
            <div className='relative z-10 flex items-center gap-2'>
              <Image src={PrepunkAvatar} alt='Prepunks' width={42} height={42} className='rounded-full' />
              <div className='flex flex-col gap-0'>
                <p className='h-5 font-semibold'>Minted {badges?.['prepunk']?.count} Prepunks</p>
                <p className='text-neutral text-lg font-medium'>
                  since {formatExpiryDate(badges?.['prepunk']?.mints[0]?.blockTime)}
                </p>
              </div>
            </div>
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export default Details
