'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import ArrowRight from 'public/icons/arrow-back.svg'
import Arrowdown from 'public/icons/arrow-down.svg'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { fetchLeaderboard } from '@/api/leaderboard'
import LeaderboardRow from '@/app/leaderboard/components/LeaderboardRow'
import { LoadingRow } from '@/app/leaderboard/components/LeaderboardList'
import { changeLeaderboardSortBy } from '@/state/reducers/leaderboard/leaderboard'

interface LeaderboardProps {
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const Leaderboard: React.FC<LeaderboardProps> = ({ setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()
  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['navigation', 'leaderboard'],
    queryFn: async () => {
      const response = await fetchLeaderboard({
        page: 1,
        limit: 6,
        sortBy: 'names_owned',
        sortOrder: 'desc',
        clubs: [],
      })
      return {
        users: response.data.users,
        nextPageParam: response.pagination.page < response.pagination.pages ? response.pagination.page + 1 : undefined,
        hasNextPage: response.pagination.page < response.pagination.pages,
        total: response.pagination.total,
      }
    },
  })

  const defaultAnimationdelay = previousDropdownOption === null ? 0.2 : 0

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center xl:gap-8'
      style={{ height: width && width < 768 ? (isDropdownOpen ? '332px' : '40px') : 'auto' }}
    >
      <div
        className='px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>Leaderboard</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='pl-lg md:pt-xl text-neutral flex h-fit w-60 flex-col justify-between gap-4 text-2xl font-semibold md:h-[380px] md:pl-0'>
        <div className='flex h-full w-fit flex-col gap-2'>
          <p className='text-lg font-medium text-[#808080]'>Sort by:</p>
          <div className='flex h-full w-fit flex-col gap-4'>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(changeLeaderboardSortBy('names_owned'))
                  setDropdownOption(null)
                }}
              >
                Names Owned
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.15}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(changeLeaderboardSortBy('names_in_clubs'))
                  setDropdownOption(null)
                }}
              >
                Names in Categories
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.3}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(changeLeaderboardSortBy('names_listed'))
                  setDropdownOption(null)
                }}
              >
                Names Listed
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.45}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(changeLeaderboardSortBy('names_sold'))
                  setDropdownOption(null)
                }}
              >
                Names Sold
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.6}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(changeLeaderboardSortBy('expired_names'))
                  setDropdownOption(null)
                }}
              >
                Names Expired
              </Link>
            </div>
          </div>
        </div>
        <div
          className='md:py-md border-neutral slideInLeft w-full md:border-t'
          style={{ animationDelay: `${defaultAnimationdelay + 0.75}s` }}
        >
          <Link
            href='/leaderboard'
            onClick={() => {
              dispatch(changeMarketplaceTab(MARKETPLACE_TABS[0]))
              setDropdownOption(null)
            }}
            className='hover:text-primary group flex items-center gap-2'
          >
            <p className='group-hover:text-primary hover-underline transition-colors duration-300'>View All Holders</p>
            <Image
              src={ArrowRight}
              alt='Arrow Right'
              width={20}
              height={20}
              className='hidden opacity-50 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:opacity-100 md:block'
            />
          </Link>
        </div>
      </div>
      <div className='hidden w-full flex-col md:flex'>
        <div
          className={cn(
            'py-md px-sm sm:px-md lg:px-lg transition-top border-tertiary sticky z-40 flex w-full items-center justify-between border-b duration-300'
          )}
        >
          <p className='text-neutral text-md xs:min-w-[36px] w-[5%] min-w-[30px] text-center font-medium sm:min-w-[40px]'>
            #
          </p>
          <p className='text-neutral text-md w-[40%] font-medium md:w-[25%]'>User</p>

          {/* Names - Sortable */}
          <div className='text-neutralfont-medium flex w-[20%] items-center gap-0.5 select-none sm:w-[12.5%] sm:gap-1 lg:w-[10%]'>
            <p className='text-md font-medium'>Names</p>
          </div>
          <p className='text-neutral text-md w-[25%] font-medium sm:w-[27.5%] md:w-[20%]'>Categories</p>
          <p className='text-neutral text-md hidden w-[5%] min-w-[120px] font-medium sm:block'></p>
        </div>
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className='fadeIn w-full'
                style={{ animationDelay: `${defaultAnimationdelay + index * 0.15}s` }}
              >
                <LoadingRow />
              </div>
            ))
          : leaderboard?.users.map((user, index) => (
              <div
                key={user.address}
                className='fadeIn w-full'
                onClick={() => {
                  setDropdownOption(null)
                }}
                style={{ animationDelay: `${defaultAnimationdelay + index * 0.15}s` }}
              >
                <LeaderboardRow
                  user={user}
                  rank={index + 1}
                  hideRows={['names_in_clubs', 'names_listed', 'names_sold', 'expired_names']}
                  className={`${index === leaderboard?.users.length - 1 ? 'border-b-0' : ''} justify-between`}
                />
              </div>
            ))}
      </div>
    </div>
  )
}

export default Leaderboard
