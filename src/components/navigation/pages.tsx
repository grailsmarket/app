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
    <div className={cn('flex flex-col gap-4 md:flex-row md:items-center', className)}>
      <Link
        href='/'
        className={cn(
          'text-lg font-semibold transition-all',
          pathname === '/' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Home
      </Link>
      <Link
        href='/marketplace'
        className={cn(
          'text-lg font-semibold transition-all',
          pathname === '/marketplace' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Explore
      </Link>
      <Link
        href='/categories'
        className={cn(
          'text-lg font-semibold transition-all',
          pathname === '/categories' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Categories
      </Link>
      <Link
        href='/portfolio'
        className={cn(
          'text-lg font-semibold transition-all',
          pathname === '/portfolio' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100'
        )}
        onClick={onClick}
      >
        Portfolio
      </Link>
    </div>
  )
}

export default Pages
