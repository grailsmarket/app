'use client'

import { cn } from '@/utils/tailwind'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

interface PagesProps {
  className?: string
  onClick?: () => void
}

const Pages = ({ className, onClick }: PagesProps) => {
  const pathname = usePathname()

  return (
    <section className={cn('flex flex-col gap-4 text-lg', className)}>
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
      <Link
        href='/analytics'
        className={cn(
          'font-semibold transition-all',
          pathname === '/analytics' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Analytics
      </Link>
      <Link
        href='/leaderboard'
        className={cn(
          'font-semibold transition-all',
          pathname === '/leaderboard' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Leaderboard
      </Link>
    </section>
  )
}

export default Pages
