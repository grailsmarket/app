'use client'

import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { useUserContext } from '@/context/user'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useRef, useState, useEffect } from 'react'

interface PagesProps {
  className?: string
  onClick?: () => void
}

const Pages = ({ className, onClick }: PagesProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { ensProfile } = useAppSelector(selectUserProfile)
  const { openConnectModal } = useConnectModal()

  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const isPortfolioPage = pathname === `/profile/${userAddress}` || pathname === `/profile/${ensProfile?.name}`

  // Determine which link is active
  const getActiveIndex = () => {
    if (pathname === '/') return 0
    if (pathname === '/marketplace') return 1
    if (pathname === '/categories') return 2
    if (isPortfolioPage && userAddress) return 3
    return -1
  }

  useEffect(() => {
    const updateIndicator = () => {
      const container = containerRef.current
      if (!container) return

      const activeIndex = getActiveIndex()
      if (activeIndex === -1) {
        setIndicatorStyle({ left: 0, width: 0 })
        return
      }

      const links = container.querySelectorAll('a')
      const activeLink = links[activeIndex] as HTMLElement
      if (activeLink) {
        setIndicatorStyle({
          left: activeLink.offsetLeft,
          width: activeLink.offsetWidth,
        })
      }
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, userAddress, isPortfolioPage])

  return (
    <div
      ref={containerRef}
      className={cn('text-md relative flex flex-col gap-4 text-xl md:flex-row md:items-center', className)}
    >
      {/* Animated underline indicator - desktop only */}
      <div
        className='bg-primary absolute -bottom-0.5 hidden h-0.5 rounded-full transition-all duration-300 ease-out md:block'
        style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
      />
      <Link
        href='/'
        className={cn(
          'font-semibold transition-all',
          pathname === '/' ? 'text-primary font-bold!' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Home
      </Link>
      <Link
        href='/marketplace'
        className={cn(
          'font-semibold transition-all',
          pathname === '/marketplace' ? 'text-primary font-bold!' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Explore
      </Link>
      <p
        className='text-foreground cursor-pointer font-semibold opacity-80 transition-all hover:opacity-100'
        onClick={() => {
          dispatch(changeMarketplaceTab(MARKETPLACE_TABS[1]))
          router.push('/marketplace')
        }}
      >
        Premium
      </p>
      <Link
        href='/categories'
        className={cn(
          'font-semibold transition-all',
          pathname === '/categories' ? 'text-primary font-bold!' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Categories
      </Link>
      {userAddress && (
        <Link
          href={`/profile/${userAddress}`}
          className={cn(
            'font-semibold text-nowrap transition-all',
            isPortfolioPage ? 'text-primary font-bold!' : 'text-foreground opacity-80 hover:opacity-100'
          )}
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
