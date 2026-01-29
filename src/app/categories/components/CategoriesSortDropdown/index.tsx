'use client'

import React, { useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectCategoriesPageFilters,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
} from '@/state/reducers/filters/categoriesPageFilters'
import { ShortArrow } from 'ethereum-identity-kit'
import {
  CATEGORIES_PAGE_SORT_OPTIONS,
  CATEGORIES_PAGE_SORT_LABELS,
  CategoriesPageSortOption,
  CategoriesPageSortDirection,
} from '@/constants/filters/categoriesPageFilters'
import ArrowUpIcon from 'public/icons/ascending.svg'
import ArrowDownIcon from 'public/icons/descending.svg'
import Image from 'next/image'

interface CategoriesSortDropdownProps {
  className?: string
}

const CategoriesSortDropdown: React.FC<CategoriesSortDropdownProps> = ({ className }) => {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectCategoriesPageFilters)
  const [isOpen, setIsOpen] = useState(false)

  const dropdownRef = useClickAway(() => {
    setIsOpen(false)
  })

  const { sort, sortDirection } = filters

  const handleTypeSelect = (type: CategoriesPageSortOption) => {
    dispatch(setCategoriesPageSort(type))
    setIsOpen(false)
  }

  const handleDirectionToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newDirection: CategoriesPageSortDirection = sortDirection === 'asc' ? 'desc' : 'asc'
    dispatch(setCategoriesPageSortDirection(newDirection))
  }

  const displayLabel = CATEGORIES_PAGE_SORT_LABELS[sort]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative w-[calc(100%-44px)]'>
        <button
          type='button'
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
          )}
        >
          <p className='text-md font-medium whitespace-nowrap sm:text-lg'>
            <span className='text-neutral text-md'>Sort:</span>&nbsp;{displayLabel}
          </p>
          <ShortArrow className={cn('h-3 w-3 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
        </button>

        {isOpen && (
          <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 max-h-[300px] w-full min-w-[180px] overflow-y-auto rounded-md border-2 shadow-lg'>
            {CATEGORIES_PAGE_SORT_OPTIONS.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  sort === type && 'bg-secondary'
                )}
              >
                {CATEGORIES_PAGE_SORT_LABELS[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type='button'
        onClick={handleDirectionToggle}
        className={cn(
          'border-tertiary hover:border-foreground/50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border-[2px] transition-all sm:h-10 sm:w-10'
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

export default CategoriesSortDropdown
