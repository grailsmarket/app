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
    <div className={cn('flex md:flex-row flex-col md:items-center gap-4', className)}>
      <Link href='/' className={cn('text-lg transition-all font-semibold', pathname === '/' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100')} onClick={onClick}>Home</Link>
      <Link href='/marketplace' className={cn('text-lg transition-all font-semibold', pathname === '/marketplace' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100')} onClick={onClick}>Explore</Link>
      <Link href='/portfolio' className={cn('text-lg transition-all font-semibold', pathname === '/portfolio' ? 'text-primary' : 'text-foreground opacity-80 hover:opacity-100')} onClick={onClick}>Portfolio</Link>
    </div>
  )
}

export default Pages
