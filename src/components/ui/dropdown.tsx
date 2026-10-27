import React, { useRef, useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import Image from 'next/image'
import { Address } from 'viem'

export interface DropdownOption {
  value: string | number | Address
  label: string
  icon?: string
}

interface DropdownProps {
  label: string
  hideLabel?: boolean
  options: DropdownOption[]
  value: string | number
  onSelect: (value: string | number | Address) => void
  className?: string
  placeholder?: string
  dropdownPosition?: 'top' | 'bottom'
  disabled?: boolean
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  hideLabel = false,
  options,
  value,
  onSelect,
  className,
  placeholder = 'Select an option',
  dropdownPosition = 'bottom',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

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
    <div className={cn('min-h-12 w-full', className)}>
      <div className='flex'>
        {/* Label section */}
        {!hideLabel && (
          <div className='bg-background border-tertiary flex min-w-25 items-center rounded-l-md border border-r-0 px-4 py-3'>
            <span className='text-lg font-semibold'>{label}</span>
          </div>
        )}

        {/* Dropdown button section */}
        <div
          ref={dropdownRef as React.RefObject<HTMLDivElement>}
          className='relative min-w-0 flex-1'
          onKeyDown={(event) => {
            if (event.key === 'Escape' && isOpen) {
              event.preventDefault()
              event.stopPropagation()
              setIsOpen(false)
              buttonRef.current?.focus()
            }
          }}
        >
          <button
            ref={buttonRef}
            type='button'
            aria-label={label}
            aria-expanded={isOpen && !disabled}
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex h-full w-full cursor-pointer items-center justify-between gap-4 rounded-r-md border px-4 py-3 pr-3 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none',
              hideLabel && 'rounded-md',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <div className='flex min-w-0 items-center gap-2'>
              {selectedOption?.icon && (
                <Image src={selectedOption.icon} alt={selectedOption.label} height={24} className='h-6 w-auto' />
              )}
              <span className='truncate text-lg font-medium'>{displayValue}</span>
            </div>
            <ShortArrow className={cn('h-4 w-4 shrink-0 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
          </button>

          {/* Dropdown menu */}
          {isOpen && !disabled && (
            <div
              className={cn(
                'bg-background border-tertiary absolute right-0 left-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-md border-2 shadow-lg',
                dropdownPosition === 'top' ? 'bottom-14' : 'top-12'
              )}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type='button'
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'hover:bg-tertiary flex w-full items-center gap-2 px-4 py-2.5 text-left text-white transition-colors',
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
