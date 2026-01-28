'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectAnalytics, setCategory, setPeriod, setSource } from '@/state/reducers/analytics'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import { PERIOD_OPTIONS, SOURCE_OPTIONS } from '@/constants/analytics'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { getCategoryDetails } from '@/utils/getCategoryDetails'

interface AnalyticsFiltersProps {
  hideTitle?: boolean
  hideCategory?: boolean
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({ hideTitle = false, hideCategory = false }) => {
  const dispatch = useAppDispatch()
  const { categories } = useCategories()
  const { period, source, category: selectedCategory } = useAppSelector(selectAnalytics)
  const selectedCategoryDetails = selectedCategory ? getCategoryDetails(selectedCategory) : null

  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const periodDropdownRef = useClickAway(() => setIsPeriodOpen(false))
  const sourceDropdownRef = useClickAway(() => setIsSourceOpen(false))
  const categoryDropdownRef = useClickAway(() => setIsCategoryOpen(false))

  const selectedPeriodLabel = PERIOD_OPTIONS.find((opt) => opt.value === period)?.label || '7 Days'
  const selectedSourceOption = SOURCE_OPTIONS.find((opt) => opt.value === source)

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

      {/* Category Dropdown */}
      {!hideCategory && (
        <div ref={categoryDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
          <button
            type='button'
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={cn(
              'border-tertiary hover:border-foreground/50 flex h-9 w-[200px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
            )}
          >
            <div className='flex items-center gap-2'>
              {selectedCategoryDetails?.avatar && selectedCategory !== 'none' && selectedCategory !== 'any' ? (
                <Image
                  src={selectedCategoryDetails.avatar}
                  alt={selectedCategoryDetails.name}
                  width={20}
                  height={20}
                  className='h-auto w-5 rounded-full'
                />
              ) : null}
              <p className='text-md font-medium whitespace-nowrap sm:text-lg'>
                {selectedCategory === 'none'
                  ? 'No Categories'
                  : selectedCategory === 'any'
                    ? 'All Categories'
                    : selectedCategoryDetails?.name || 'Pick a Category'}
              </p>
            </div>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')} />
          </button>

          {isCategoryOpen && (
            <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 max-h-[max(200px,50vh)] w-full overflow-scroll rounded-md border-2 shadow-lg'>
              <button
                key='all'
                onClick={() => {
                  dispatch(setCategory(null))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  selectedCategory === null && 'bg-secondary'
                )}
              >
                ---------
              </button>
              <button
                key='all'
                onClick={() => {
                  dispatch(setCategory('none'))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  selectedCategory === null && 'bg-secondary'
                )}
              >
                No Categories
              </button>
              <button
                key='all'
                onClick={() => {
                  dispatch(setCategory('any'))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                  selectedCategory === null && 'bg-secondary'
                )}
              >
                All Categories
              </button>
              {categories?.map((category) => {
                const categoryDetails = getCategoryDetails(category.name)
                return (
                  <button
                    key={category.name}
                    onClick={() => {
                      dispatch(setCategory(category.name))
                      setIsCategoryOpen(false)
                    }}
                    className={cn(
                      'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors sm:text-lg',
                      selectedCategory === category.name && 'bg-secondary'
                    )}
                  >
                    {categoryDetails.avatar && (
                      <Image
                        src={categoryDetails.avatar}
                        alt={categoryDetails.name}
                        width={20}
                        height={20}
                        className='h-auto w-5 rounded-full'
                      />
                    )}
                    {categoryDetails.name}
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
