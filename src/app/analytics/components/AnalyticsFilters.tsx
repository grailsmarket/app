'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectAnalytics,
  toggleCategory,
  clearCategories,
  setPeriod,
  setSource,
  setCategories,
} from '@/state/reducers/analytics'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import { PERIOD_OPTIONS, SOURCE_OPTIONS } from '@/constants/analytics'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import CheckIcon from 'public/icons/check.svg'

interface AnalyticsFiltersProps {
  hideTitle?: boolean
  hideCategory?: boolean
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({ hideTitle = false, hideCategory = false }) => {
  const dispatch = useAppDispatch()
  const { categories: allCategories } = useCategories()
  const { period, source, categories: selectedCategories } = useAppSelector(selectAnalytics)

  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const periodDropdownRef = useClickAway(() => setIsPeriodOpen(false))
  const sourceDropdownRef = useClickAway(() => setIsSourceOpen(false))
  const categoryDropdownRef = useClickAway(() => setIsCategoryOpen(false))

  const selectedPeriodLabel = PERIOD_OPTIONS.find((opt) => opt.value === period)?.label || '7 Days'
  const selectedSourceOption = SOURCE_OPTIONS.find((opt) => opt.value === source)

  const handleCategoryToggle = (categoryName: string) => {
    if (selectedCategories.includes('none') || selectedCategories.includes('any')) dispatch(setCategories([]))
    dispatch(toggleCategory(categoryName))
  }

  const handleClearCategories = () => {
    dispatch(clearCategories())
  }

  // Get display text for selected categories
  const getCategoriesDisplayText = () => {
    if (selectedCategories.includes('none')) return 'No Categories'
    if (selectedCategories.includes('any')) return 'All Categories'
    if (selectedCategories.length === 0) return 'All Categories'
    if (selectedCategories.length === 1) {
      const details = getCategoryDetails(selectedCategories[0])
      return details.name
    }
    return `${selectedCategories.length} Categories`
  }

  return (
    <div className='border-tertiary flex flex-row flex-wrap items-center gap-2 border-b-2 px-2 py-2.5 sm:px-4'>
      {!hideTitle && <h1 className='mr-2 text-2xl font-bold'>Analytics</h1>}

      {/* Period Dropdown */}
      <div ref={periodDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
        <button
          type='button'
          onClick={() => setIsPeriodOpen(!isPeriodOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-[110px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
          )}
        >
          <p className='text-md font-medium whitespace-nowrap sm:text-lg'>{selectedPeriodLabel}</p>
          <ShortArrow className={cn('h-3 w-3 transition-transform', isPeriodOpen ? 'rotate-0' : 'rotate-180')} />
        </button>

        {isPeriodOpen && (
          <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border-2 shadow-lg'>
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  dispatch(setPeriod(option.value as AnalyticsPeriod))
                  setIsPeriodOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  period === option.value && 'bg-secondary'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Source Dropdown */}
      <div ref={sourceDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
        <button
          type='button'
          onClick={() => setIsSourceOpen(!isSourceOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-[130px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
          )}
        >
          <div className='flex items-center gap-2'>
            {selectedSourceOption?.icon && (
              <Image
                src={selectedSourceOption.icon}
                alt={selectedSourceOption.label}
                width={20}
                height={20}
                className='h-auto w-5'
              />
            )}
            <p className='text-md font-medium whitespace-nowrap sm:text-lg'>{selectedSourceOption?.label}</p>
          </div>
          <ShortArrow className={cn('h-3 w-3 transition-transform', isSourceOpen ? 'rotate-0' : 'rotate-180')} />
        </button>

        {isSourceOpen && (
          <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-md border-2 shadow-lg'>
            {SOURCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  dispatch(setSource(option.value as AnalyticsSource))
                  setIsSourceOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  source === option.value && 'bg-secondary'
                )}
              >
                {option.icon && (
                  <Image src={option.icon} alt={option.label} width={20} height={20} className='h-auto w-5' />
                )}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Category Multi-select Dropdown */}
      {!hideCategory && (
        <div ref={categoryDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
          <button
            type='button'
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={cn(
              'border-tertiary hover:border-foreground/50 flex h-9 w-[180px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10 sm:w-[200px]'
            )}
          >
            <div className='flex items-center gap-2 overflow-hidden'>
              {selectedCategories.length > 0 && selectedCategories.length <= 3 && (
                <div className='flex items-center -space-x-1'>
                  {selectedCategories
                    .filter((cat) => cat !== 'none' && cat !== 'any')
                    .slice(0, 3)
                    .map((cat) => {
                      const details = getCategoryDetails(cat)
                      return (
                        <Image
                          key={cat}
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
              {selectedCategories.length > 0 && (
                <button
                  onClick={handleClearCategories}
                  className='hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-red-500 transition-colors sm:text-lg'
                >
                  Clear All
                </button>
              )}
              {/* All Categories option */}
              <button
                onClick={() => {
                  dispatch(setCategories(['none']))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  selectedCategories.length === 0 && 'bg-secondary'
                )}
              >
                No Categories
              </button>
              {/* All Categories option */}
              <button
                onClick={() => {
                  dispatch(setCategories(['any']))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  selectedCategories.length === 0 && 'bg-secondary'
                )}
              >
                All Categories
              </button>
              {allCategories?.map((category) => {
                const categoryDetails = getCategoryDetails(category.name)
                const isSelected = selectedCategories.includes(category.name)
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
      )}
    </div>
  )
}

export default AnalyticsFilters
