'use client'

import { fetchDomains } from '@/api/domains/fetchDomains'
import Card from '@/components/domains/grid/components/card'
import LoadingCard from '@/components/domains/grid/components/loadingCard'
import { useUserContext } from '@/context/user'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ArrowRight from 'public/icons/arrow-back.svg'
import Arrowdown from 'public/icons/arrow-down.svg'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { addCategories, clearFilters, setSort } from '@/state/reducers/filters/marketplacePremiumFilters'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

interface PremiumProps {
  dropdownOption: string | null
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const Premium: React.FC<PremiumProps> = ({ dropdownOption, setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { categories } = useCategories()
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()
  const { authStatus } = useUserContext()
  const { data: premium, isLoading } = useQuery({
    queryKey: ['navigation', 'premium'],
    queryFn: () =>
      fetchDomains({
        limit: 42,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          status: ['Premium'],
          sort: 'expiry_date_asc',
          type: {
            Digits: 'exclude',
            Emojis: 'exclude',
            Repeating: 'include',
            Letters: 'include',
          },
        },
        searchTerm: '',
        isAuthenticated: authStatus === 'authenticated',
        inAnyCategory: true,
        excludeCategories: ['prepunks'],
      }),
  })

  const cardCount = useMemo(() => {
    if (width && width < 640) return 2
    if (width && width < 780) return 3
    if (width && width < 1024) return 3
    if (width && width < 1210) return 4
    if (width && width < 1460) return 5
    if (width && width < 1658) return 6
    return 7
  }, [width])

  const defaultAnimationdelay = previousDropdownOption ? 0 : DEFAULT_ANIMATION_DELAY

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  const cardContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardContainerRef.current && dropdownOption === 'premium') {
      cardContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [cardContainerRef, dropdownOption])

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center xl:gap-8'
      style={{ height: width && width < 768 ? (isDropdownOpen ? '348px' : '40px') : 'auto' }}
      onScroll={(e) => e.stopPropagation()}
    >
      <div
        className='px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>Premium</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='pl-lg md:pt-xl text-neutral flex h-fit w-56 flex-col justify-between gap-4 text-2xl font-semibold md:h-[370px] md:pl-0'>
        <div className='flex h-full w-fit flex-col gap-4'>
          <div className='fadeIn w-fit md:hidden' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/marketplace?tab=premium'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                dispatch(setSort('expiry_date_asc'))
                setDropdownOption(null)
              }}
            >
              Premium
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/marketplace?tab=premium'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                dispatch(setSort('expiry_date_asc'))
                setDropdownOption(null)
              }}
            >
              Ending Soon
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT}s` }}
          >
            <Link
              href='/marketplace?tab=premium&sort=expiry_date_desc'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                dispatch(setSort('expiry_date_desc'))
                setDropdownOption(null)
              }}
            >
              Recently Expired
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 2}s` }}
          >
            <Link
              href='/marketplace?tab=premium&sort=view_count_desc'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                dispatch(setSort('view_count_desc'))
                setDropdownOption(null)
              }}
            >
              Most Viewed
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 3}s` }}
          >
            <Link
              href='/marketplace?tab=premium&sort=watchers_count_desc'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                dispatch(setSort('watchers_count_desc'))
                setDropdownOption(null)
              }}
            >
              Most Watchlisted
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 4}s` }}
          >
            <Link
              href='/marketplace?tab=available&sort=last_sale_desc'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                dispatch(setSort('last_sale_price_desc'))
                setDropdownOption(null)
              }}
            >
              Highest Last Sale
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 5}s` }}
          >
            <Link
              href='/marketplace?tab=activity&sort=last_sale_desc'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                if (categories?.length) {
                  dispatch(clearFilters())
                  dispatch(addCategories(categories?.map((category) => category.name) || []))
                }
                setDropdownOption(null)
              }}
            >
              In Category
            </Link>
          </div>
        </div>
        <div
          className='md:py-md border-neutral slideInLeft hidden w-full md:block md:border-t'
          style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 6}s` }}
        >
          <Link
            href='/marketplace?tab=names'
            onClick={() => {
              dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
              dispatch(setSort(null))
              setDropdownOption(null)
            }}
            className='hover:text-primary group flex items-center gap-2'
          >
            <p className='group-hover:text-primary hover-underline transition-colors duration-300'>View All</p>
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
      <div
        ref={cardContainerRef}
        className='hidden max-h-[370px] max-w-[1480px] flex-row flex-wrap gap-2 overflow-y-auto md:flex xl:gap-4'
        style={{
          width: `${width && width < 768 ? '100%' : cardCount * (180 + 16)}px`,
          maxWidth: '1560px',
        }}
      >
        {isLoading
          ? Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className='fadeIn h-[370px] w-[180px]'
                style={{
                  animationDelay: `${defaultAnimationdelay + Math.min(index, cardCount) * ANIMATION_DELAY_INCREMENT}s`,
                }}
              >
                <LoadingCard />
              </div>
            ))
          : premium?.domains.map((domain, index) => (
              <div
                key={domain.name}
                className='bg-secondary fadeIn h-[370px] w-[180px]'
                onClick={() => {
                  setDropdownOption(null)
                }}
                style={{
                  animationDelay: `${defaultAnimationdelay + Math.min(index, cardCount) * ANIMATION_DELAY_INCREMENT}s`,
                }}
              >
                <Card domain={domain} />
              </div>
            ))}
      </div>
    </div>
  )
}

export default Premium
