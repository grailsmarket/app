'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectAnalytics, setPeriod, setSource } from '@/state/reducers/analytics'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import { PERIOD_OPTIONS, SOURCE_OPTIONS } from '@/constants/analytics'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'

const AnalyticsFilters: React.FC = () => {
  const dispatch = useAppDispatch()
  const { period, source } = useAppSelector(selectAnalytics)
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)

  const periodDropdownRef = useClickAway(() => setIsPeriodOpen(false))
  const sourceDropdownRef = useClickAway(() => setIsSourceOpen(false))

  const selectedPeriodLabel = PERIOD_OPTIONS.find((opt) => opt.value === period)?.label || '7 Days'
  const selectedSourceOption = SOURCE_OPTIONS.find((opt) => opt.value === source)

  return (
    <div className='border-tertiary flex flex-col gap-2 border-b-2 px-4 py-2.5 sm:flex-row sm:items-center'>
      <h1 className='text-2xl font-bold'>Analytics</h1>

      {/* Period Dropdown */}
      <div ref={periodDropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
        <button
          type='button'
          onClick={() => setIsPeriodOpen(!isPeriodOpen)}
          className={cn(
            'border-tertiary hover:border-foreground/50 flex h-9 w-[150px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
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
            'border-tertiary hover:border-foreground/50 flex h-9 w-[150px] cursor-pointer items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all sm:h-10'
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
    </div>
  )
}

export default AnalyticsFilters
