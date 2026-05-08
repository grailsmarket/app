'use client'

import React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/utils/tailwind'

interface Props {
  isLocked: boolean
  className?: string
}

const LockIcon: React.FC<Props> = ({ isLocked, className }) => {
  return (
    <svg
      viewBox='-3 -3 30 30'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      className={cn('h-7 w-7', className)}
    >
      <rect x='4' y='11' width='16' height='10' rx='2' />
      <circle cx='12' cy='15' r='1.2' fill='currentColor' stroke='none' />
      <line x1='12' y1='15.5' x2='12' y2='17.5' />
      <motion.path
        d='M 8 11 V 7 a 4 4 0 0 1 8 0 V 11'
        animate={{ rotateY: isLocked ? 0 : -180, transformOrigin: '8px 11px' }}
        transition={{ type: 'spring', stiffness: 600, damping: 55 }}
        style={{ transformOrigin: '16px 11px', transformBox: 'view-box' }}
      />
    </svg>
  )
}

export default LockIcon
