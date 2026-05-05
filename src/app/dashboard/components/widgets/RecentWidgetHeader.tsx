'use client'

import React from 'react'
import Link from 'next/link'
import { Arrow } from 'ethereum-identity-kit'

interface RecentWidgetHeaderProps {
  subtitle: string
  viewAllHref: string
}

const RecentWidgetHeader: React.FC<RecentWidgetHeaderProps> = ({ subtitle, viewAllHref }) => (
  <div className='border-tertiary flex h-10 shrink-0 items-center justify-between border-b px-3'>
    <span className='text-neutral text-xs font-medium'>{subtitle}</span>
    <Link
      href={viewAllHref}
      className='text-primary hover:text-primary/80 group flex items-center gap-1.5 text-xs font-semibold'
    >
      <span>View All</span>
      <Arrow className='text-primary h-2.5 w-2.5 rotate-180 transition-transform group-hover:translate-x-0.5' />
    </Link>
  </div>
)

export default RecentWidgetHeader
