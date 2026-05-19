import React from 'react'
import { cn } from '@/utils/tailwind'
import type { TwitterPost } from '../types'

export const VerifiedBadge: React.FC<{ type: TwitterPost['author']['verifiedType'] }> = ({ type }) => (
  <svg
    viewBox='0 0 24 24'
    aria-label='Verified account'
    className={cn('h-[18px] w-[18px] shrink-0', type === 'business' ? 'text-[#ffd400]' : 'text-[#1d9bf0]')}
  >
    <path
      fill='currentColor'
      d='M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zM10.6 16.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4-6 6z'
    />
  </svg>
)
