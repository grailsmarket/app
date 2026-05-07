'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Arrowdown from 'public/icons/arrow-down.svg'
import analyticsIcon from 'public/icons/analytics-primary.svg'
import trophyIcon from 'public/icons/trophy-primary.svg'
import dashboardIcon from 'public/icons/grid-primary.svg'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

interface ProProps {
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const Pro: React.FC<ProProps> = ({ setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { width } = useWindowSize()

  const defaultAnimationDelay = previousDropdownOption ? 0 : DEFAULT_ANIMATION_DELAY

  const cards = [
    {
      title: 'Subscription',
      description: 'Manage your Grails subscription.',
      icon: <Image src={dashboardIcon} alt='Dashboard' width={24} height={24} />,
      href: '/dashboard',
      onClick: () => setDropdownOption(null),
    },
    {
      title: 'Dashboard',
      description: 'Customizable widgets for names, analytics, and activity.',
      icon: <Image src={dashboardIcon} alt='Dashboard' width={24} height={24} />,
      href: '/dashboard',
      onClick: () => setDropdownOption(null),
    },
    {
      title: 'AI Search',
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
  ]

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  const isMobile = width ? width < 768 : false

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center'
      style={{ height: isMobile ? (isDropdownOpen ? '700px' : '40px') : 'auto' }}
    >
      <div
        className='px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>Pro</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='px-md flex w-full flex-row flex-wrap gap-4 md:px-0'>
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

export default Pro
