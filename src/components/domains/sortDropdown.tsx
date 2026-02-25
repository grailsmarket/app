'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { ShortArrow } from 'ethereum-identity-kit'
import {
  SORT_LISTING_FILTERS,
  SORT_LISTING_FILTER_LABELS,
  SORT_TYPES,
  SORT_TYPE_LABELS,
  SortListingFilter,
  SortType,
} from '@/constants/filters/marketplaceFilters'
import { SortFilterType } from '@/state/reducers/filters/marketplaceFilters'
import ArrowUpIcon from 'public/icons/ascending.svg'
import ArrowDownIcon from 'public/icons/descending.svg'
import Image from 'next/image'

type SortDirection = 'asc' | 'desc'

interface SortDropdownProps {
  className?: string
}

const SortDropdown: React.FC<SortDropdownProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false)

  const dispatch = useAppDispatch()
  const { selectors, actions, context, marketplaceTab, categoryTab, categoriesPageTab, profileTab } = useFilterRouter()

  const activeTab = useMemo(() => {
    switch (context) {
      case 'marketplace':
        return marketplaceTab?.value
      case 'category':
        return categoryTab?.value
      case 'categoriesPage':
        return categoriesPageTab?.value
      case 'profile':
        return profileTab?.value
      default:
        return 'names'
    }
  }, [context, marketplaceTab, categoryTab, categoriesPageTab, profileTab])

  const sortLabels = useMemo(() => {
    const isExpiredNamesTab =
      activeTab === 'expired' || activeTab === 'grace' || activeTab === 'premium' || activeTab === 'available'

    if (isExpiredNamesTab) {
      return SORT_TYPE_LABELS
    } else {
      return { ...SORT_TYPE_LABELS, ...SORT_LISTING_FILTER_LABELS }
    }
  }, [activeTab])

  const sortTypes = useMemo(() => {
    const isExpiredNamesTab =
      activeTab === 'expired' || activeTab === 'grace' || activeTab === 'premium' || activeTab === 'available'

    if (isExpiredNamesTab) {
      return SORT_TYPES
    } else {
      return [...SORT_TYPES, ...SORT_LISTING_FILTERS]
    }
  }, [activeTab])

  const dropdownRef = useClickAway(() => {
    setIsOpen(false)
  })

  const { sortType, sortDirection } = useMemo(() => {
    const currentSort = selectors.filters.sort as SortFilterType | null

    if (!currentSort) {
      return { sortType: null as SortType | null, sortDirection: 'asc' as SortDirection }
    }

    const parts = currentSort.split('_')
    const direction = parts[parts.length - 1] as SortDirection

    // Extract type (everything before the direction)
    const type = parts.slice(0, -1).join('_') as SortType

    return { sortType: type, sortDirection: direction }
  }, [selectors.filters.sort])

  const handleTypeSelect = (type: SortType | SortListingFilter | null) => {
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

  const categories = selectors.filters.categories
  const hasOnlyOneCategory = context === 'category' ? true : categories.length === 1

  useEffect(() => {
    if (sortType === 'ranking') {
      if (!hasOnlyOneCategory) {
        dispatch(actions.setSort(null))
      }
    }
  }, [sortType, hasOnlyOneCategory, dispatch, actions])

  const displayLabel = sortType ? sortLabels[sortType] : '---'

  return (
    <div className={cn('flex w-full items-center gap-1', className)}>
      <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative w-[calc(100%-44px)]'>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-full min-w-[190px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
          )}
        >
          <p className='text-md font-medium whitespace-nowrap sm:text-lg'>
            <span className='text-neutral text-md'>Sort:</span>&nbsp;{displayLabel}
          </p>
          <ShortArrow className={cn('h-3 w-3 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
        </button>

        {isOpen && (
          <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 w-full min-w-[160px] overflow-hidden rounded-md border-2 shadow-lg'>
            <button
              onClick={() => handleTypeSelect(null)}
              className={cn(
                'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                !sortType && 'bg-secondary'
              )}
            >
              None
            </button>

            {sortTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  sortType === type && 'bg-secondary',
                  type === 'ranking' && !hasOnlyOneCategory && 'pointer-events-none opacity-50'
                )}
              >
                {sortLabels[type as keyof typeof sortLabels]}
              </button>
            ))}
          </div>
        )}
      </div>

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
