'use client'

import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { useUserContext } from '@/context/user'
import { useIsTouchDevice } from '@/hooks/useDevice'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeMarketplaceTab, selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useRef, useEffect, useCallback } from 'react'

interface PagesProps {
  className?: string
  onClick?: () => void
  setDropdownOption?: (option: string | null) => void
  dropdownOption?: string | null
}

const Pages = ({ className, onClick, setDropdownOption, dropdownOption }: PagesProps) => {
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const isTouchDevice = useIsTouchDevice()
  const { userAddress } = useUserContext()
  const { ensProfile } = useAppSelector(selectUserProfile)
  const { openConnectModal } = useConnectModal()

  const { selectedTab } = useAppSelector(selectMarketplace)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseEnter = useCallback(
    (option: string | null) => {
      if (isTouchDevice) return
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = setTimeout(
        () => {
          setDropdownOption?.(option)
        },
        dropdownOption ? 0 : 75
      )
    },
    [isTouchDevice, setDropdownOption, dropdownOption]
  )

  const handleMouseLeave = () => {
    if (isTouchDevice) return
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [])

  const isPortfolioPage = pathname === `/profile/${userAddress}` || pathname === `/profile/${ensProfile?.name}`

  return (
    <div
      ref={containerRef}
      className={cn('text-md relative flex flex-col gap-4 text-xl md:flex-row md:items-center', className)}
    >
      {/* Animated underline indicator - desktop only */}
      {/* <div
        className='bg-primary absolute -bottom-0.5 hidden h-0.5 rounded-full transition-all duration-300 ease-out md:block'
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      /> */}
      {/* <Link
        href='/'
        className={cn(
          'font-medium transition-all',
          pathname === '/' ? 'text-primary font-bold!' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Home
      </Link> */}
      <Link
        href='/marketplace'
        className={cn(
          'hover-underline font-medium transition-all',
          pathname === '/marketplace' && selectedTab?.value !== 'premium'
            ? 'text-primary active font-bold!'
            : 'text-foreground opacity-80 hover:opacity-100',
          dropdownOption === 'explore' && 'active text-primary opacity-100'
        )}
        onMouseEnter={() => handleMouseEnter('explore')}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          dispatch(changeMarketplaceTab(MARKETPLACE_TABS[0]))
          onClick?.()
        }}
      >
        Explore
      </Link>
      <Link
        href='/marketplace?tab=premium'
        className={cn(
          'hover-underline font-medium transition-all',
          pathname === '/marketplace' && selectedTab?.value === 'premium'
            ? 'text-primary active font-bold!'
            : 'text-foreground opacity-80 hover:opacity-100',
          dropdownOption === 'premium' && 'active text-primary opacity-100'
        )}
        onMouseEnter={() => handleMouseEnter('premium')}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          dispatch(changeMarketplaceTab(MARKETPLACE_TABS[2]))
          onClick?.()
        }}
      >
        Premium
      </Link>
      <Link
        href='/categories'
        className={cn(
          'hover-underline font-medium transition-all',
          pathname === '/categories'
            ? 'text-primary active font-bold!'
            : 'text-foreground opacity-80 hover:opacity-100',
          dropdownOption === 'categories' && 'active text-primary opacity-100'
        )}
        onMouseEnter={() => handleMouseEnter('categories')}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        Categories
      </Link>
      <Link
        href='/analytics'
        className={cn(
          'hover-underline font-medium transition-all',
          pathname === '/analytics' ? 'text-primary active font-bold!' : 'text-foreground opacity-80 hover:opacity-100',
          dropdownOption === 'analytics' && 'active text-primary opacity-100'
        )}
        onMouseEnter={() => handleMouseEnter('analytics')}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
      >
        Analytics
      </Link>

      {userAddress && (
        <Link
          href={`/profile/${userAddress}`}
          className={cn(
            'hover-underline font-medium text-nowrap transition-all',
            isPortfolioPage ? 'text-primary active font-bold!' : 'text-foreground opacity-80 hover:opacity-100',
            dropdownOption === 'my-profile' && 'active text-primary opacity-100'
          )}
          onMouseEnter={() => handleMouseEnter(null)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            if (!userAddress) {
              e.preventDefault()
              e.stopPropagation()
              return openConnectModal?.()
            }

            onClick?.()
          }}
        >
          My Profile
        </Link>
      )}
    </div>
  )
}

export default Pages
