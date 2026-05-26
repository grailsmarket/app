'use client'

import React from 'react'
import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'
import type { ActivityTypeFilterType } from '@/types/filters/activity'
import { cn } from '@/utils/tailwind'

interface ActivityTypeSidebarProps {
  selectedTypes: ActivityTypeFilterType[]
  onToggleType: (type: ActivityTypeFilterType) => void
  onClear: () => void
}

const ActivityTypeSidebar: React.FC<ActivityTypeSidebarProps> = ({ selectedTypes, onToggleType, onClear }) => {
  return (
    <aside className='border-tertiary bg-background/80 w-full shrink-0 border-b-2 lg:sticky lg:top-0 lg:h-full lg:w-64 lg:border-r-2 lg:border-b-0'>
      <div className='flex h-full flex-col gap-3 p-3 sm:px-5 lg:p-4'>
        <div className='flex items-center justify-between gap-3'>
          <p className='text-lg font-bold'>Activity</p>
          <button
            type='button'
            onClick={onClear}
            disabled={selectedTypes.length === 0}
            className='text-primary text-sm font-bold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40'
          >
            Clear
          </button>
        </div>
        <div className='flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0'>
          {ACTIVITY_TYPE_FILTERS.map((filter) => {
            const isSelected = selectedTypes.includes(filter.value)

            return (
              <button
                key={filter.value}
                type='button'
                onClick={() => onToggleType(filter.value)}
                className={cn(
                  'border-tertiary hover:border-foreground/40 flex shrink-0 items-center justify-between gap-3 rounded-md border-2 px-3 py-2 text-left transition-colors lg:w-full',
                  isSelected && 'border-primary bg-primary/10'
                )}
              >
                <span className='text-md font-semibold whitespace-nowrap'>{filter.label}</span>
                <span
                  className={cn(
                    'border-tertiary h-4 w-4 rounded-full border-2 transition-colors',
                    isSelected && 'border-primary bg-primary'
                  )}
                />
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default ActivityTypeSidebar
