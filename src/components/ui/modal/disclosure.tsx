'use client'

import React, { useId } from 'react'
import { cn } from '@/utils/tailwind'
import { ChevronIcon } from './icons'

interface DisclosureProps {
  title: React.ReactNode
  /** The current value, shown while closed: "Connected wallet", "Not set". */
  preview?: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  description?: React.ReactNode
  children?: React.ReactNode
}

// A settings row that shows its value and opens in place to edit it.
const Disclosure: React.FC<DisclosureProps> = ({ title, preview, isOpen, onToggle, description, children }) => {
  const contentId = useId()

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors duration-300',
        isOpen ? 'bg-secondary border-secondary' : 'border-tertiary'
      )}
    >
      <button
        type='button'
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
        className='hover:bg-secondary focus-visible:outline-primary flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed'
      >
        <span className='shrink-0 text-lg font-semibold'>{title}</span>
        <span
          className='text-neutral text-md min-w-0 flex-1 truncate text-right'
          title={typeof preview === 'string' ? preview : undefined}
        >
          {preview}
        </span>
        <ChevronIcon
          className={cn('text-neutral h-4 w-4 shrink-0 transition-transform duration-300', isOpen && 'rotate-180')}
        />
      </button>
      <div
        id={contentId}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div inert={!isOpen} className={cn('flex min-h-0 flex-col gap-2 overflow-hidden px-3', isOpen && 'pb-3')}>
          {description && <p className='text-neutral text-md'>{description}</p>}
          {children}
        </div>
      </div>
    </div>
  )
}

export default Disclosure
