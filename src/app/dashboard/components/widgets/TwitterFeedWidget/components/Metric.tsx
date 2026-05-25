import React from 'react'
import { cn } from '@/utils/tailwind'
import { formatMetric } from '../utils'

export const Metric: React.FC<{ href: string; icon: React.ReactNode; value: number; hoverClass: string }> = ({
  href,
  icon,
  value,
  hoverClass,
}) => (
  <a
    href={href}
    target='_blank'
    rel='noreferrer'
    className={cn('group flex items-center gap-1 text-[13px]', hoverClass)}
  >
    <span className='flex h-[18px] w-[18px] items-center justify-center'>{icon}</span>
    {value > 0 && <span>{formatMetric(value)}</span>}
  </a>
)
