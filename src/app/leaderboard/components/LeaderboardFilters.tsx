'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import { fetchCategories } from '@/api/domains/fetchCategories'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import ArrowUpIcon from 'public/icons/ascending.svg'
import ArrowDownIcon from 'public/icons/descending.svg'
import CheckIcon from 'public/icons/check.svg'
import {
  changeLeaderboardSelectedClubs,
  changeLeaderboardSortBy,
  changeLeaderboardSortOrder,
} from '@/state/reducers/leaderboard/leaderboard'
import { useAppDispatch } from '@/state/hooks'

const SORT_OPTIONS: { value: LeaderboardSortBy; label: string }[] = [
  { value: 'names_owned', label: 'Names Owned' },
  { value: 'names_in_clubs', label: 'Category Names' },
  { value: 'expired_names', label: 'Expired Names' },
  { value: 'names_listed', label: 'Listed Names' },
  { value: 'names_sold', label: 'Sold Names' },
]

interface LeaderboardFiltersProps {
  sortBy: LeaderboardSortBy
  sortOrder: LeaderboardSortOrder
  selectedClubs: string[]
}

const LeaderboardFilters: React.FC<LeaderboardFiltersProps> = ({ sortBy, sortOrder, selectedClubs }) => {
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const sortDropdownRef = useClickAway(() => setIsSortOpen(false))
  const categoryDropdownRef = useClickAway(() => setIsCategoryOpen(false))

  const dispatch = useAppDispatch()
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  })

  const handleSortSelect = (value: LeaderboardSortBy) => {
    dispatch(changeLeaderboardSortBy(value))
    setIsSortOpen(false)
  }

  const handleDirectionToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch(changeLeaderboardSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))
  }

  const handleCategoryToggle = (categoryName: string) => {
    if (selectedClubs.includes(categoryName)) {
      dispatch(changeLeaderboardSelectedClubs(selectedClubs.filter((c) => c !== categoryName)))
    } else {
      dispatch(changeLeaderboardSelectedClubs([...selectedClubs, categoryName]))
    }
  }

  const handleClearCategories = () => {
    dispatch(changeLeaderboardSelectedClubs([]))
  }

  const selectedSortLabel = SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label || 'Names Owned'

  // Get display text for selected categories
  const getCategoriesDisplayText = () => {
    if (selectedClubs.length === 0) return 'All Categories'
    if (selectedClubs.length === 1) {
      const details = getCategoryDetails(selectedClubs[0])
      return details.name
    }
    return `${selectedClubs.length} Categories`
  }

  // Get first selected category's avatar for display
  // const getFirstSelectedCategoryAvatar = () => {
  //   if (selectedClubs.length === 0) return null
  //   const details = getCategoryDetails(selectedClubs[0])
  //   return details.avatar
  // }

  return (
    <div className='border-tertiary flex flex-row flex-wrap items-center gap-2 border-b-2 px-2 py-2.5 sm:px-4'>
      <h1 className='mr-2 text-2xl font-bold'>Leaderboard</h1>

      {/* Categories Multi-select Dropdown */}
      <div ref={categoryDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
        <button
          type='button'
          onClick={() => setIsCategoryOpen(!isCategoryOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-[180px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10 sm:w-[200px]'
          )}
        >
          <div className='flex items-center gap-2 overflow-hidden'>
            {selectedClubs.length > 0 && selectedClubs.length <= 3 && (
              <div className='flex items-center -space-x-1'>
                {selectedClubs.slice(0, 3).map((club) => {
                  const details = getCategoryDetails(club)
                  return (
                    <Image
                      key={club}
                      src={details.avatar}
                      alt={details.name}
                      width={20}
                      height={20}
                      className='border-background h-5 w-5 rounded-full border'
                    />
                  )
                })}
              </div>
            )}
            <p className='text-md truncate font-medium whitespace-nowrap sm:text-lg'>{getCategoriesDisplayText()}</p>
          </div>
          <ShortArrow
            className={cn('h-3 w-3 flex-shrink-0 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')}
          />
        </button>

        {isCategoryOpen && (
          <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 max-h-[max(200px,50vh)] w-full min-w-[220px] overflow-y-auto rounded-md border-2 shadow-lg'>
            {/* Clear All option */}
            {selectedClubs.length > 0 && (
              <button
                onClick={handleClearCategories}
                className='hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-red-500 transition-colors sm:text-lg'
              >
                Clear All
              </button>
            )}
            {/* All Categories option */}
            <button
              onClick={handleClearCategories}
              className={cn(
                'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                selectedClubs.length === 0 && 'bg-secondary'
              )}
            >
              All Categories
            </button>
            {categories?.map((category) => {
              const categoryDetails = getCategoryDetails(category.name)
              const isSelected = selectedClubs.includes(category.name)
              return (
                <button
                  key={category.name}
                  onClick={() => handleCategoryToggle(category.name)}
                  className={cn(
                    'hover:bg-tertiary text-md flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                    isSelected && 'bg-secondary'
                  )}
                >
                  <div className='flex items-center gap-2'>
                    {categoryDetails.avatar && (
                      <Image
                        src={categoryDetails.avatar}
                        alt={categoryDetails.name}
                        width={20}
                        height={20}
                        className='h-5 w-5 rounded-full'
                      />
                    )}
                    <span className='truncate'>{categoryDetails.name}</span>
                  </div>
                  {isSelected && <Image src={CheckIcon} alt='Selected' width={16} height={16} />}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className='flex items-center gap-1'>
        <div ref={sortDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
          <button
            type='button'
            onClick={() => setIsSortOpen(!isSortOpen)}
            className={cn(
              'border-tertiary hover:border-foreground/50 flex h-9 w-[180px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10 sm:w-[200px]'
            )}
          >
            <p className='text-md font-medium whitespace-nowrap sm:text-lg'>
              <span className='text-neutral text-md'>Sort:</span>&nbsp;{selectedSortLabel}
            </p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isSortOpen ? 'rotate-0' : 'rotate-180')} />
          </button>

          {isSortOpen && (
            <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 w-full min-w-[180px] overflow-y-auto rounded-md border-2 shadow-lg'>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortSelect(option.value)}
                  className={cn(
                    'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                    sortBy === option.value && 'bg-secondary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sort Direction Toggle */}
        <button
          type='button'
          onClick={handleDirectionToggle}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border-[2px] transition-all sm:h-10 sm:w-10'
          )}
          aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
        >
          {sortOrder === 'asc' ? (
            <Image src={ArrowUpIcon} alt='Sort ascending' width={24} height={24} />
          ) : (
            <Image src={ArrowDownIcon} alt='Sort descending' width={24} height={24} />
          )}
        </button>
      </div>
    </div>
  )
}

export default LeaderboardFilters
