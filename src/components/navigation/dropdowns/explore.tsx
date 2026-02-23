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
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

interface ExploreProps {
  dropdownOption: string | null
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const Explore: React.FC<ExploreProps> = ({ dropdownOption, setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()
  const { authStatus } = useUserContext()
  const { data: listings, isLoading } = useQuery({
    queryKey: ['explore', 'listings'],
    queryFn: () =>
      fetchDomains({
        limit: 36,
        pageParam: 2,
        filters: {
          ...emptyFilterState,
          market: {
            ...emptyFilterState.market,
            Listed: 'yes',
          },
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
    if (width && width < 780) return 2
    if (width && width < 968) return 3
    if (width && width < 1100) return 3
    if (width && width < 1400) return 4
    if (width && width < 1600) return 5
    return 6
  }, [width])

  const defaultAnimationdelay = previousDropdownOption === null ? DEFAULT_ANIMATION_DELAY : 0

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  const cardContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (cardContainerRef.current && dropdownOption === 'explore') {
      cardContainerRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [cardContainerRef, dropdownOption])

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center xl:gap-8'
      style={{ height: width && width < 768 ? (isDropdownOpen ? '260px' : '40px') : 'auto' }}
    >
      <div
        className='px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>Explore</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='pl-lg md:pt-xl text-neutral flex h-fit w-56 flex-col justify-between gap-4 text-2xl font-semibold md:h-[400px] md:pl-0'>
        <div className='flex h-full w-fit flex-col gap-4'>
          <div className='fadeIn w-fit md:hidden' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/marketplace'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[0]))
                setDropdownOption(null)
              }}
            >
              Explore
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/marketplace?tab=listings'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[1]))
                setDropdownOption(null)
              }}
            >
              Listings
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT}s` }}
          >
            <Link
              href='/marketplace?tab=premium'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
                setDropdownOption(null)
              }}
            >
              Premium
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 2}s` }}
          >
            <Link
              href='/marketplace?tab=available'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[3]))
                setDropdownOption(null)
              }}
            >
              Available
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 3}s` }}
          >
            <Link
              href='/marketplace?tab=activity'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeMarketplaceTab(MARKETPLACE_TABS[4]))
                setDropdownOption(null)
              }}
            >
              Activity
            </Link>
          </div>
        </div>
        <div
          className='md:py-md border-neutral slideInLeft hidden w-full md:block md:border-t'
          style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 4}s` }}
        >
          <Link
            href='/marketplace?tab=names'
            onClick={() => {
              dispatch(changeMarketplaceTab(MARKETPLACE_TABS[0]))
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
        className='hidden max-h-[400px] w-fit max-w-[1480px] flex-row flex-wrap gap-2 overflow-y-auto md:flex xl:gap-4'
      >
        {isLoading
          ? Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className='fadeIn h-[400px] w-[220px]'
                style={{
                  animationDelay: `${defaultAnimationdelay + Math.min(index, cardCount) * ANIMATION_DELAY_INCREMENT}s`,
                }}
              >
                <LoadingCard />
              </div>
            ))
          : listings?.domains.map((domain, index) => (
              <div
                key={domain.name}
                className='bg-secondary fadeIn h-[400px] w-[220px]'
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

export default Explore
