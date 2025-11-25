import React, { useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import Image from 'next/image'

export interface DropdownOption {
  value: string | number
  label: string
  icon?: string
}

interface DropdownProps {
  label: string
  hideLabel?: boolean
  options: DropdownOption[]
  value: string | number
  onSelect: (value: string | number) => void
  className?: string
  placeholder?: string
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  hideLabel = false,
  options,
  value,
  onSelect,
  className,
  placeholder = 'Select an option',
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const dropdownRef = useClickAway(() => {
    setIsOpen(false)
  })

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue =
    selectedOption?.label ||
    new Date(Number(Number(value) * 1000)).toLocaleDateString(navigator.language || 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }) ||
    placeholder

  const handleSelect = (optionValue: string | number) => {
    onSelect(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={cn('w-full', className)}>
      <div className='flex'>
        {/* Label section */}
        {!hideLabel && (
          <div className='bg-background border-tertiary flex h-12 min-w-[100px] items-center rounded-l-md border border-r-0 px-4 py-3'>
            <span className='text-lg font-semibold'>{label}</span>
          </div>
        )}

        {/* Dropdown button section */}
        <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative flex-1'>
          <button
            type='button'
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex h-12 w-full items-center justify-between rounded-r-md border px-4 py-3 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none',
              hideLabel && 'rounded-md'
            )}
          >
            <div className='flex items-center gap-2'>
              {selectedOption?.icon && (
                <Image src={selectedOption.icon} alt={selectedOption.label} height={24} className='h-6 w-auto' />
              )}
              <span className='text-lg font-medium'>{displayValue}</span>
            </div>
            <ShortArrow className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className='bg-background border-tertiary absolute top-full right-0 left-0 z-50 mt-2 max-h-[240px] overflow-y-auto rounded-md border-2 shadow-lg'>
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'hover:bg-tertiary flex w-full items-center gap-2 px-4 py-2.5 text-left text-white transition-colors md:py-3',
                    option.value === value && 'bg-secondary'
                  )}
                >
                  {option.icon && <Image src={option.icon} alt={option.label} height={24} className='h-6 w-auto' />}
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dropdown
