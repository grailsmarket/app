import React, { useId, useRef, useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'

export interface MobileTabOption {
  value: string
  label: React.ReactNode
  onClick: () => void
}

interface MobileTabDropdownProps {
  options: MobileTabOption[]
  value: string
  className?: string
}

const MobileTabDropdown: React.FC<MobileTabDropdownProps> = ({ options, value, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const listboxId = useId()
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const dropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsOpen(false)
  })

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (option: MobileTabOption) => {
    option.onClick()
    setIsOpen(false)
  }

  const focusOption = (index: number) => {
    optionRefs.current[index]?.focus()
  }

  const openAndFocusSelectedOption = () => {
    setIsOpen(true)
    window.requestAnimationFrame(() => {
      const selectedIndex = Math.max(
        options.findIndex((option) => option.value === value),
        0
      )
      focusOption(selectedIndex)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !isOpen) {
      e.preventDefault()
      openAndFocusSelectedOption()
      return
    }

    if (!isOpen) return

    const currentIndex = optionRefs.current.findIndex((option) => option === document.activeElement)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusOption(currentIndex === -1 ? 0 : (currentIndex + 1) % options.length)
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusOption(currentIndex <= 0 ? options.length - 1 : currentIndex - 1)
    }

    if (e.key === 'Home') {
      e.preventDefault()
      focusOption(0)
    }

    if (e.key === 'End') {
      e.preventDefault()
      focusOption(options.length - 1)
    }
  }

  return (
    <div ref={dropdownRef} className={cn('relative flex-1', className)} onKeyDown={handleKeyDown}>
      <button
        type='button'
        aria-haspopup='listbox'
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label='Select tab'
        onClick={() => (isOpen ? setIsOpen(false) : openAndFocusSelectedOption())}
        className='bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary focus-visible:ring-primary flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-4 rounded-md border px-4 py-2 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none focus-visible:ring-2'
      >
        <div className='flex min-w-0 items-center gap-2'>
          <span className='flex min-w-0 items-center gap-2 overflow-hidden text-lg font-medium [&_p]:truncate'>
            {selectedOption?.label}
          </span>
        </div>
        <ShortArrow className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
      </button>

      {isOpen && (
        <div
          id={listboxId}
          role='listbox'
          className='bg-background border-tertiary absolute right-0 left-0 z-50 mt-2 max-h-[240px] overflow-y-auto rounded-md border-2 shadow-lg'
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              type='button'
              role='option'
              aria-selected={option.value === value}
              onClick={() => handleSelect(option)}
              className={cn(
                'hover:bg-tertiary focus:bg-tertiary flex w-full min-w-0 items-center gap-2 px-4 py-2.5 text-left text-white transition-colors focus:outline-none',
                option.value === value && 'bg-secondary'
              )}
            >
              <span className='flex min-w-0 items-center gap-2 overflow-hidden [&_p]:truncate'>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MobileTabDropdown
