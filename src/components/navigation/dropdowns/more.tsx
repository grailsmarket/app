'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import Arrowdown from 'public/icons/arrow-down.svg'
import analyticsIcon from 'public/icons/analytics-primary.svg'
import trophyIcon from 'public/icons/trophy-primary.svg'
import activityIcon from 'public/icons/activity-primary.svg'
import searchIcon from 'public/icons/search-primary.svg'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

interface MoreProps {
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const More: React.FC<MoreProps> = ({ setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()

  const defaultAnimationDelay = previousDropdownOption ? 0 : DEFAULT_ANIMATION_DELAY
  const activityTab = MARKETPLACE_TABS.find((tab) => tab.value === 'activity')!

  const cards = [
    {
      title: 'Analytics',
      description: 'Market trends, sales, and volume data.',
      icon: <Image src={analyticsIcon} alt='Analytics' width={24} height={24} />,
      href: '/analytics',
      onClick: () => setDropdownOption(null),
    },
    {
      title: 'Leaderboard',
      description: 'Top collectors, traders, and domainers.',
      icon: <Image src={trophyIcon} alt='Leaderboard' width={24} height={24} />,
      href: '/leaderboard',
      onClick: () => setDropdownOption(null),
    },
    {
      title: 'Live Activity',
      description: 'Real-time mints, sales, and listings.',
      icon: <Image src={activityIcon} alt='Live Activity' width={24} height={24} />,
      href: '/marketplace?tab=activity',
      onClick: () => {
        dispatch(changeMarketplaceTab(activityTab))
        setDropdownOption(null)
      },
    },
    {
      title: 'Bulk Search',
      description: 'Search many names at once.',
      icon: <Image src={searchIcon} alt='Bulk Search' width={20} height={20} />,
      href: '/bulk-search',
      onClick: () => setDropdownOption(null),
    },
  ]

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  const isMobile = useMemo(() => (width ? width < 768 : false), [width])

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center'
      style={{ height: isMobile ? (isDropdownOpen ? '480px' : '40px') : 'auto' }}
    >
      <div
        className='px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>More</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='px-md md:pt-xl flex w-full flex-row flex-wrap gap-4 md:px-0'>
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            onClick={card.onClick}
            className='fadeIn hover:bg-primary/15 border-primary p-lg flex w-full cursor-pointer flex-col gap-2 rounded-md border transition-colors md:min-w-[220px] md:flex-1'
            style={{ animationDelay: `${defaultAnimationDelay + ANIMATION_DELAY_INCREMENT * index}s` }}
          >
            <div className='flex flex-row items-center gap-2'>
              {card.icon}
              <h3 className='text-primary text-2xl font-bold'>{card.title}</h3>
            </div>
            <p className='text-lg font-medium'>{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default More
