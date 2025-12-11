'use client'

import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

interface PagesProps {
  className?: string
  onClick?: () => void
}

const Pages = ({ className, onClick }: PagesProps) => {
  const pathname = usePathname()
  const { userAddress } = useUserContext()
  const { ensProfile } = useAppSelector(selectUserProfile)
  const { openConnectModal } = useConnectModal()

  const isPortfolioPage = pathname === `/profile/${userAddress}` || pathname === `/profile/${ensProfile?.name}`

  return (
    <div className={cn('text-md flex flex-col gap-4 text-lg md:flex-row md:items-center', className)}>
      <Link
        href='/'
        className={cn(
          'font-semibold transition-all',
          pathname === '/' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Home
      </Link>
      <Link
        href='/marketplace'
        className={cn(
          'font-semibold transition-all',
          pathname === '/marketplace' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Explore
      </Link>
      <Link
        href='/categories'
        className={cn(
          'font-semibold transition-all',
          pathname === '/categories' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Categories
      </Link>
      {userAddress && <Link
        href={`/profile/${userAddress}`}
        className={cn(
          'font-semibold transition-all',
          isPortfolioPage ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
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
        Portfolio
      </Link>}
    </div>
  )
}

export default Pages
