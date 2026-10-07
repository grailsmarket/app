'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  removeCategory,
  addCategory,
  selectAnalytics,
  setCategories,
  setPeriod,
  setSource,
} from '@/state/reducers/analytics'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'
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
  const { period, source, categories: selectedCategories } = useAppSelector(selectAnalytics)
  const selectedCategoriesDetails = useMemo(() => {
    if (!selectedCategories) return null
    return selectedCategories.map((category) => {
      if (category === 'none') return { name: 'No Category', avatar: null }
      if (category === 'all') return { name: 'All Categories', avatar: null }
      return { ...getCategoryDetails(category), name: categories?.find((c) => c.name === category)?.display_name }
    })
  }, [selectedCategories])

  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const periodDropdownRef = useClickAway(() => setIsPeriodOpen(false))
  const sourceDropdownRef = useClickAway(() => setIsSourceOpen(false))
  const categoryDropdownRef = useClickAway(() => setIsCategoryOpen(false))

  const selectedPeriodLabel = PERIOD_OPTIONS.find((opt) => opt.value === period)?.label || '7 Days'
  const selectedSourceOption = SOURCE_OPTIONS.find((opt) => opt.value === source)

  useEffect(() => {
    if (selectedCategories.includes('all') && selectedCategories.length > 1) {
      dispatch(removeCategory('all'))
    }
  }, [selectedCategories])

  return (
    <div className='border-tertiary flex min-h-14.5 flex-row flex-wrap items-center gap-2 border-b-2 px-2 py-2 @[40rem]/app:px-4 @[48rem]/app:py-0'>
      {!hideTitle && <h1 className='mr-2 text-2xl font-bold'>Analytics</h1>}

      {/* Period Dropdown */}
      <div ref={periodDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
        <button
          type='button'
          onClick={() => setIsPeriodOpen(!isPeriodOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-27.5 cursor-pointer items-center justify-between gap-1.5 rounded-sm border-2 bg-transparent px-3 transition-all @[40rem]/app:h-10'
          )}
        >
          <p className='text-md font-medium whitespace-nowrap @[40rem]/app:text-lg'>{selectedPeriodLabel}</p>
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
                  'hover:bg-tertiary text-md flex w-full items-center px-3 py-2 text-left font-medium transition-colors @[40rem]/app:text-lg',
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
            'border-tertiary hover:border-foreground/50 flex h-9 w-32.5 cursor-pointer items-center justify-between gap-1.5 rounded-sm border-2 bg-transparent px-3 transition-all @[40rem]/app:h-10'
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
            <p className='text-md font-medium whitespace-nowrap @[40rem]/app:text-lg'>{selectedSourceOption?.label}</p>
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
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors @[40rem]/app:text-lg',
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
              'border-tertiary hover:border-foreground/50 flex h-9 w-50 cursor-pointer items-center justify-between gap-1.5 rounded-sm border-2 bg-transparent px-3 transition-all @[40rem]/app:h-10'
            )}
          >
            <div className='flex items-center gap-2'>
              <div className='relative flex items-center'>
                {selectedCategoriesDetails
                  ?.filter((category) => !!category.avatar)
                  .slice(0, 3)
                  .map((category, index) => (
                    <Image
                      key={`${category.avatar}-${index}`}
                      src={category.avatar as string}
                      alt={category.name || selectedCategories[index]}
                      width={20}
                      height={20}
                      className='h-auto w-5 rounded-full'
                      style={{
                        marginLeft: index > 0 ? -10 : '0',
                      }}
                    />
                  ))}
              </div>
              <p className='text-md font-medium whitespace-nowrap @[40rem]/app:text-lg'>
                {selectedCategories.length === 0 && '---------'}
                {selectedCategories.length === 1 && (selectedCategoriesDetails?.[0]?.name || selectedCategories[0])}
                {selectedCategories.length > 1 && `${selectedCategories.length} Categories`}
              </p>
            </div>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')} />
          </button>

          {isCategoryOpen && (
            <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 max-h-[max(200px,50vh)] w-full overflow-scroll rounded-md border-2 shadow-lg'>
              <button
                key='none'
                onClick={() => {
                  dispatch(setCategories([]))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors @[40rem]/app:text-lg',
                  selectedCategories.length === 0 && 'bg-secondary'
                )}
              >
                ---------
              </button>
              <button
                key='no category'
                onClick={() => {
                  if (selectedCategories.includes('none')) {
                    dispatch(removeCategory('none'))
                  } else {
                    dispatch(addCategory('none'))
                  }
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium transition-colors @[40rem]/app:text-lg',
                  selectedCategories.length === 0 && 'bg-secondary'
                )}
              >
                No Category
                {selectedCategories.includes('none') && <Check className='h-4 w-4 transition-transform' />}
              </button>
              <button
                key='all'
                onClick={() => {
                  dispatch(setCategories(['all']))
                  setIsCategoryOpen(false)
                }}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium transition-colors @[40rem]/app:text-lg',
                  selectedCategories.includes('all') && 'bg-secondary'
                )}
              >
                All Categories
                {selectedCategories.includes('all') && <Check className='h-4 w-4 transition-transform' />}
              </button>
              {categories?.map((category) => {
                const categoryDetails = getCategoryDetails(category.name)
                return (
                  <button
                    key={category.name}
                    onClick={() => {
                      if (selectedCategories.includes(category.name)) {
                        dispatch(removeCategory(category.name))
                      } else {
                        dispatch(addCategory(category.name))
                      }
                      setIsCategoryOpen(false)
                    }}
                    className='hover:bg-tertiary text-md flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium transition-colors @[40rem]/app:text-lg'
                  >
                    <div className='flex items-center gap-2'>
                      {categoryDetails.avatar && (
                        <Image
                          src={categoryDetails.avatar}
                          alt={category.display_name}
                          width={20}
                          height={20}
                          className='h-auto w-5 rounded-full'
                        />
                      )}
                      {category.display_name}
                    </div>
                    {selectedCategories.includes(category.name) && <Check className='h-4 w-4 transition-transform' />}
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
