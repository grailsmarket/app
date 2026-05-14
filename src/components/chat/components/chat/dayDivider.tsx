'use client'

import React from 'react'
import { format, isToday } from 'date-fns'

interface Props {
  date: string | Date
}

const formatDayLabel = (date: Date): string => {
  if (isToday(date)) return 'Today'
  const includeYear = date.getFullYear() < new Date().getFullYear()
  return format(date, includeYear ? 'EEEE, MMMM d yyyy' : 'EEEE, MMMM d')
}

const DayDivider: React.FC<Props> = ({ date }) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return (
    <div className='flex justify-center py-1'>
      <span className='text-neutral text-sm font-medium'>{formatDayLabel(d)}</span>
    </div>
  )
}

export default DayDivider
