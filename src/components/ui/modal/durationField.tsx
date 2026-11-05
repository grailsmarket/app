'use client'

import React, { useId } from 'react'
import Tooltip from '@/components/ui/tooltip'
import { timeUnitOptions } from '@/constants/registration'
import { cn } from '@/utils/tailwind'
import { AlertIcon, CalendarIcon, ChevronIcon, MinusIcon, PlusIcon, SyncIcon } from './icons'

interface DurationFieldProps {
  label?: React.ReactNode
  quantity: number
  unit: string
  /** Show the end-date button instead of the quantity stepper. */
  isCustom: boolean
  customDateLabel?: string | null
  onQuantityChange: (quantity: number) => void
  onUnitChange: (unit: string) => void
  /** Opens the date picker from the end-date button. */
  onPickDate: () => void
  /** The "Select a custom date" link under the control. */
  onSelectCustomDate?: () => void
  hint?: React.ReactNode
  warning?: React.ReactNode
  /** The per-name editor inside a NameList row. */
  compact?: boolean
  /** Draws a sync button before the unit select that puts this value back on the base duration. */
  onSync?: () => void
  /** Already following the base duration: the sync button is disabled. */
  isSynced?: boolean
  className?: string
}

const DurationField: React.FC<DurationFieldProps> = ({
  quantity,
  unit,
  isCustom,
  customDateLabel,
  onQuantityChange,
  onUnitChange,
  onPickDate,
  onSelectCustomDate,
  hint,
  warning,
  compact,
  onSync,
  isSynced,
  className,
}) => {
  const inputId = useId()
  const ground = compact ? 'bg-background' : 'bg-secondary'
  const height = compact ? 'h-10' : 'h-12'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className='flex gap-2'>
        {isCustom ? (
          <button
            type='button'
            onClick={onPickDate}
            className={cn(
              'bg-primary-soft border-primary-line hover:border-primary flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md border px-4 text-left font-bold transition-colors disabled:cursor-not-allowed',
              height,
              compact ? 'text-lg' : 'text-xl'
            )}
          >
            <CalendarIcon className='text-primary h-4.5 w-4.5 shrink-0' />
            <span className={cn('truncate', !customDateLabel && 'text-neutral font-normal')}>
              {customDateLabel || 'Select Date'}
            </span>
          </button>
        ) : (
          <div
            className={cn(
              'border-tertiary focus-within:border-foreground focus-within:ring-primary-soft flex min-w-0 flex-1 items-stretch rounded-md border transition-colors focus-within:ring-3',
              ground,
              height
            )}
          >
            <button
              type='button'
              aria-label='Decrease'
              disabled={quantity <= 1}
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              className={stepperButtonClassName}
            >
              <MinusIcon className='h-4.5 w-4.5' />
            </button>
            <input
              id={inputId}
              type='number'
              min={1}
              inputMode='numeric'
              aria-label='Quantity'
              placeholder='Number'
              value={quantity || ''}
              onChange={(e) => onQuantityChange(Number(e.target.value))}
              className='w-full min-w-0 bg-transparent text-center text-xl font-bold tabular-nums focus:outline-none disabled:cursor-not-allowed'
            />
            <button
              type='button'
              aria-label='Increase'
              onClick={() => onQuantityChange(quantity + 1)}
              className={stepperButtonClassName}
            >
              <PlusIcon className='h-4.5 w-4.5' />
            </button>
          </div>
        )}
        <div className='relative w-[38%] shrink-0'>
          <select
            aria-label='Unit'
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            className={cn(
              'border-tertiary hover:border-neutral focus:border-foreground focus:ring-primary-soft w-full cursor-pointer appearance-none rounded-md border pr-9 pl-4 text-lg font-bold transition-colors focus:ring-3 focus:outline-none disabled:cursor-not-allowed',
              ground,
              height
            )}
          >
            {timeUnitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronIcon className='text-neutral pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2' />
        </div>
        {onSync && (
          <Tooltip label='Sync with base duration' position='top' align='right'>
            <button
              type='button'
              aria-label='Sync with base duration'
              onClick={onSync}
              disabled={isSynced}
              className={cn(
                'border-tertiary text-neutral hover:border-neutral hover:text-foreground group disabled:hover:border-tertiary disabled:hover:text-neutral flex shrink-0 cursor-pointer items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                ground,
                height,
                compact ? 'w-10' : 'w-12'
              )}
            >
              <SyncIcon className='h-4.5 w-4.5 transition-transform duration-300 group-active:-rotate-90 motion-reduce:transition-none' />
            </button>
          </Tooltip>
        )}
      </div>
      {!isCustom && onSelectCustomDate && (
        <button
          type='button'
          onClick={onSelectCustomDate}
          className='text-primary text-md mx-auto flex w-fit cursor-pointer items-center gap-1.5 py-0.5 font-semibold underline-offset-3 hover:underline disabled:cursor-not-allowed'
        >
          <CalendarIcon className='h-4 w-4' />
          Select a custom date
        </button>
      )}
      {warning ? (
        <p className='text-md flex items-center gap-1.5 text-yellow-400'>
          <AlertIcon className='h-3.5 w-3.5 shrink-0' />
          {warning}
        </p>
      ) : (
        hint && (
          <div className='bg-secondary border-tertiary rounded-md border p-3'>
            <p className='text-neutral text-md'>{hint}</p>
          </div>
        )
      )}
    </div>
  )
}

const stepperButtonClassName =
  'text-neutral hover:bg-tertiary hover:text-foreground flex w-11 shrink-0 cursor-pointer items-center justify-center transition-colors first:rounded-l-md last:rounded-r-md disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent'

export default DurationField
