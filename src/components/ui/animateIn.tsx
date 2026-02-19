'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/utils/tailwind'

const AnimateIn = ({
  children,
  className,
  delay,
  animation = 'fadeIn',
}: {
  children: ReactNode
  className?: string
  delay?: string
  animation?: string
}) => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={cn('opacity-0', mounted && animation, className)}
      style={delay ? { animationDelay: delay } : undefined}
    >
      {children}
    </div>
  )
}

export default AnimateIn
