'use client'

import React, { useState, useMemo } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { ShortArrow } from 'ethereum-identity-kit'
import { SORT_TYPES, SORT_TYPE_LABELS, SortType } from '@/constants/filters/marketplaceFilters'
import { SortFilterType } from '@/state/reducers/filters/marketplaceFilters'
import ArrowUpIcon from 'public/icons/ascending.svg'
import ArrowDownIcon from 'public/icons/descending.svg'
import Image from 'next/image'

type SortDirection = 'asc' | 'desc'

interface SortDropdownProps {
  className?: string
}

const SortDropdown: React.FC<SortDropdownProps> = ({ className }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const [isOpen, setIsOpen] = useState(false)

  const dropdownRef = useClickAway(() => {
    setIsOpen(false)
  })

  // Parse current sort value to extract type and direction
  const { sortType, sortDirection } = useMemo(() => {
    const currentSort = selectors.filters.sort as SortFilterType | null

    if (!currentSort) {
      return { sortType: null as SortType | null, sortDirection: 'asc' as SortDirection }
    }

    // Extract direction (last part after underscore)
    const parts = currentSort.split('_')
    const direction = parts[parts.length - 1] as SortDirection

    // Extract type (everything before the direction)
    const type = parts.slice(0, -1).join('_') as SortType

    return { sortType: type, sortDirection: direction }
  }, [selectors.filters.sort])

  const handleTypeSelect = (type: SortType | null) => {
    if (type === null) {
      dispatch(actions.setSort(null))
    } else {
      const newSort = `${type}_${sortDirection}` as SortFilterType
      dispatch(actions.setSort(newSort))
    }
    setIsOpen(false)
  }

  const handleDirectionToggle = (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!sortType) return

    const newDirection: SortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    const newSort = `${sortType}_${newDirection}` as SortFilterType
    dispatch(actions.setSort(newSort))
  }

  const displayLabel = sortType ? SORT_TYPE_LABELS[sortType] : '---'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Sort Type Dropdown */}
      <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
          )}
        >
          <span className='text-md font-medium whitespace-nowrap sm:text-lg'>
            <span className='text-neutral text-md'>Sort by:</span>&nbsp;{displayLabel}
          </span>
          <ShortArrow className={cn('h-3 w-3 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
        </button>

        {isOpen && (
          <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 w-full min-w-[160px] overflow-hidden rounded-md border-2 shadow-lg'>
            {/* None option */}
            <button
              onClick={() => handleTypeSelect(null)}
              className={cn(
                'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                !sortType && 'bg-secondary'
              )}
            >
              None
            </button>

            {/* Sort type options */}
            {SORT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  sortType === type && 'bg-secondary'
                )}
              >
                {SORT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Direction Toggle Button */}
      <button
        type='button'
        onClick={handleDirectionToggle}
        disabled={!sortType}
        className={cn(
          'border-tertiary flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border-[2px] transition-all sm:h-10 sm:w-10',
          sortType ? 'hover:border-foreground/50 opacity-100' : 'cursor-not-allowed opacity-40'
        )}
        aria-label={sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'}
      >
        {sortDirection === 'asc' ? (
          <Image src={ArrowUpIcon} alt='Sort ascending' width={24} height={24} />
        ) : (
          <Image src={ArrowDownIcon} alt='Sort descending' width={24} height={24} />
        )}
      </button>
    </div>
  )
}

export default SortDropdown
