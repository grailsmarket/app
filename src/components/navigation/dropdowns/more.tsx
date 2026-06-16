'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import analyticsIcon from 'public/icons/analytics-primary.svg'
import trophyIcon from 'public/icons/trophy-primary.svg'
import activityIcon from 'public/icons/activity-primary.svg'
import searchIcon from 'public/icons/search-primary.svg'
import chatIcon from 'public/icons/chat-primary.svg'
import { useAppDispatch } from '@/state/hooks'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

interface MoreProps {
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const More: React.FC<MoreProps> = ({ setDropdownOption, previousDropdownOption }) => {
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
    {
      title: 'Feed',
      description: 'Live ENS comments across Grails.',
      icon: <Image src={chatIcon} alt='Feed' width={24} height={24} />,
      href: '/feed',
      onClick: () => setDropdownOption(null),
    },
  ]

  return (
    <div className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center'>
      <div className='px-md hidden w-full flex-row flex-wrap gap-4 md:flex md:px-0'>
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
      <div className='flex flex-col gap-0'>
        {cards.map((card, index) => (
          <Link
            key={card.title}
            href={card.href}
            onClick={card.onClick}
            className='px-md border-neutral border-b-2 py-3.5'
            style={{ animationDelay: `${defaultAnimationDelay + ANIMATION_DELAY_INCREMENT * index}s` }}
          >
            <h3 className='text-3xl font-semibold'>{card.title}</h3>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default More
