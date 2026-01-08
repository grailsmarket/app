'use client'

import { useState, RefObject } from 'react'
import { cn } from '@/utils/tailwind'
import { useClickAway } from '@/hooks/useClickAway'

interface FilterDropdownProps<T extends string> {
  label: string
  value: T
  options: readonly T[]
  optionLabels: Record<T, string>
  onChange: (option: T) => void
  noneValue?: T
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  optionLabels,
  onChange,
  noneValue,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useClickAway(() => setIsOpen(false))

  const handleSelect = (option: T) => {
    onChange(option)
    setIsOpen(false)
  }

  const isNone = noneValue !== undefined && value === noneValue

  return (
    <div className='px-lg py-md flex items-center justify-between'>
      <p className='text-lg font-medium'>{label}</p>
      <div ref={dropdownRef as RefObject<HTMLDivElement>} className='relative'>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'text-md flex min-w-[90px] cursor-pointer items-center justify-between gap-2 border-b px-2 py-1 font-medium transition-colors',
            isOpen ? 'border-primary' : 'border-tertiary hover:border-primary'
          )}
        >
          <span className={cn('text-foreground', isNone && 'text-neutral')}>{optionLabels[value]}</span>
          <svg
            className={cn('text-neutral h-4 w-4 transition-transform', isOpen && 'rotate-180')}
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </button>

        {isOpen && (
          <div className='bg-background border-tertiary absolute right-0 z-50 mt-1 min-w-[90px] border shadow-lg'>
            {options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                className={cn(
                  'text-md w-full cursor-pointer px-3 py-2 text-left font-medium transition-colors',
                  value === option ? 'bg-primary/20 text-primary' : 'text-light-200 hover:bg-secondary',
                  noneValue !== undefined && option === noneValue && 'text-neutral-500'
                )}
              >
                {optionLabels[option]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterDropdown
