'use client'

import React from 'react'
import Image from 'next/image'
import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'
import type { ActivityTypeFilterType } from '@/types/filters/activity'
import FilterSelector from '@/components/filters/components/FilterSelector'
import { cn } from '@/utils/tailwind'
import CloseIcon from 'public/icons/cross.svg'
import FilterIcon from 'public/icons/filter.svg'

interface ActivityTypeSidebarProps {
  isOpen: boolean
  selectedTypes: ActivityTypeFilterType[]
  onToggleType: (type: ActivityTypeFilterType) => void
  onClear: () => void
  onClose: () => void
}

const ActivityTypeSidebar: React.FC<ActivityTypeSidebarProps> = ({
  isOpen,
  selectedTypes,
  onToggleType,
  onClear,
  onClose,
}) => {
  return (
    <aside
      className={cn(
        'bg-background border-tertiary absolute top-0 bottom-0 left-0 z-40 flex w-full max-w-full flex-col overflow-hidden border-r-2 shadow-md transition-transform duration-300 md:w-[292px] md:min-w-[292px] lg:duration-100',
        isOpen ? 'translate-x-0' : '-translate-x-[110%]'
      )}
    >
      <div className='pt-md relative flex items-center justify-between'>
        <div className='px-lg py-md flex w-full min-w-full justify-between transition-transform lg:min-w-[292px]'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            >
              <Image src={CloseIcon} alt='Close' width={16} height={16} />
            </button>
            <div className='flex max-w-full items-center gap-1.5 pl-0.5 text-sm font-bold'>
              <Image src={FilterIcon} alt='filter icon' height={16} width={16} />
              <p className='text-light-800 text-xl leading-6 font-bold'>Filters</p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClear}
            disabled={selectedTypes.length === 0}
            className='border-tertiary text-md hover:bg-secondary h-9 rounded-sm border px-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 md:h-10'
          >
            Clear
          </button>
        </div>
      </div>
      <div className='bg-dark-700 flex min-h-0 flex-1 flex-col overflow-y-auto'>
        <div className='w-full p-3'>
          <div className='flex w-full flex-col gap-3'>
            <p className='text-lg leading-[18px] font-medium'>Type</p>
          </div>
        </div>
        <div className='flex flex-col overflow-x-hidden'>
          {ACTIVITY_TYPE_FILTERS.map((item) => {
            const isSelected = selectedTypes.includes(item.value)

            return (
              <div
                key={item.value}
                onClick={() => onToggleType(item.value)}
                className='hover:bg-secondary flex cursor-pointer items-center justify-between rounded-sm p-3'
              >
                <p className='text-md font-medium'>{item.label}</p>
                <FilterSelector isActive={isSelected} onClick={() => onToggleType(item.value)} />
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export default ActivityTypeSidebar
