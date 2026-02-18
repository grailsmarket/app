'use client'

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
import {
  useRegistrationsChart,
  useOffersChart,
  useTopRegistrations,
  useVolumeChart,
  useSalesChart,
  useTopOffers,
  useTopSales,
} from '@/app/analytics/hooks/useAnalyticsData'
import TopListCard from '@/app/analytics/components/TopListCard'
import { setCategory, setPeriod, setSource } from '@/state/reducers/analytics'
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

interface AnalyticsProps {
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const Analytics: React.FC<AnalyticsProps> = ({ setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()
  const { data: offersData, isLoading: offersLoading } = useTopOffers()
  const { data: salesData, isLoading: salesLoading } = useTopSales()
  const { data: saleChartData, isLoading: saleChartLoading } = useSalesChart()
  const { data: offerChartData, isLoading: offerChartLoading } = useOffersChart()
  const { data: volumeChartData, isLoading: volumeChartLoading } = useVolumeChart()
  const { data: registrationsData, isLoading: registrationsLoading } = useTopRegistrations()
  const { data: registrationChartData, isLoading: registrationChartLoading } = useRegistrationsChart()

  const defaultAnimationdelay = previousDropdownOption === null ? DEFAULT_ANIMATION_DELAY : 0

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center xl:gap-8'
      style={{ height: width && width < 768 ? (isDropdownOpen ? '350px' : '40px') : 'auto' }}
    >
      <div
        className='px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>Analytics</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='pl-lg md:pt-xl text-neutral flex h-fit w-60 flex-col justify-between gap-4 text-2xl font-semibold md:h-[400px] md:pl-0'>
        <div className='flex h-full w-fit flex-col gap-2'>
          {/* <p className='text-lg font-medium text-[#808080]'>View for:</p> */}
          <div className='flex h-full w-fit flex-col gap-4'>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setCategory('any'))
                  setDropdownOption(null)
                }}
              >
                Analytics
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
              <Link
                href='/leaderboard'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setCategory('any'))
                  setDropdownOption(null)
                }}
              >
                Leaderboard
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT}s` }}>
              <Link
                href='/analytics'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setCategory('any'))
                  setDropdownOption(null)
                }}
              >
                All Categories
              </Link>
            </div>
            {/* <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.15}s` }}>
              <Link
                href='/analytics'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setCategory('none'))
                  setDropdownOption(null)
                }}
              >
                No Categories
              </Link>
            </div> */}
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 2}s` }}>
              <Link
                href='/analytics'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setSource('grails'))
                  setDropdownOption(null)
                }}
              >
                Grails
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 3}s` }}>
              <Link
                href='/analytics'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setSource('opensea'))
                  setDropdownOption(null)
                }}
              >
                OpenSea
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 4}s` }}>
              <Link
                href='/analytics'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setPeriod('7d'))
                  setDropdownOption(null)
                }}
              >
                Last Week
              </Link>
            </div>
            <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 5}s` }}>
              <Link
                href='/analytics'
                className='hover:text-primary hover-underline transition-all duration-200'
                onClick={() => {
                  dispatch(setPeriod('30d'))
                  setDropdownOption(null)
                }}
              >
                Last Month
              </Link>
            </div>
          </div>
        </div>
        <div
          className='md:py-md border-neutral slideInLeft hidden w-full md:block md:border-t'
          style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 6}s` }}
        >
          <Link
            href='/analytics'
            onClick={() => {
              dispatch(changeMarketplaceTab(MARKETPLACE_TABS[0]))
              setDropdownOption(null)
            }}
            className='hover:text-primary group flex items-center gap-2'
          >
            <p className='group-hover:text-primary hover-underline transition-colors duration-300'>All Data</p>
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
      <div className='hidden w-fit flex-row gap-4 md:flex'>
        <div className='fadeIn hidden md:flex' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
          <TopListCard
            title='Top Sales'
            type='sales'
            isLoading={salesLoading}
            data={salesData?.data?.results.slice(0, 7)}
            chartData={saleChartData?.data?.points}
            chartLoading={saleChartLoading}
            volumeData={volumeChartData?.data?.points}
            volumeLoading={volumeChartLoading}
          />
        </div>
        <div className='fadeIn hidden 2xl:flex' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT}s` }}>
          <TopListCard
            title='Top Offers'
            type='offers'
            isLoading={offersLoading}
            data={offersData?.data?.results.slice(0, 7)}
            chartData={offerChartData?.data?.points}
            chartLoading={offerChartLoading}
          />
        </div>
        <div className='fadeIn hidden lg:flex' style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 2}s` }}>
          <TopListCard
            title='Top Registrations'
            type='registrations'
            isLoading={registrationsLoading}
            data={registrationsData?.data?.results.slice(0, 7)}
            chartData={registrationChartData?.data?.points}
            chartLoading={registrationChartLoading}
          />
        </div>
      </div>
    </div>
  )
}

export default Analytics
