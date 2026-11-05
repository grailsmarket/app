'use client'

import React, { useState } from 'react'
import { Check } from 'ethereum-identity-kit'

export type NameChip = string | { name: string; done?: boolean }

interface NameChipsProps {
  /** Names, or { name, done } to tick names already handled. */
  names: NameChip[]
  /** Chips shown before "+N more". */
  max?: number
}

const NameChips: React.FC<NameChipsProps> = ({ names, max = 4 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const chips = names.map((chip) => (typeof chip === 'string' ? { name: chip, done: false } : chip))
  const shown = isExpanded ? chips : chips.slice(0, max)
  const hiddenCount = chips.length - shown.length

  return (
    <div className='scrollbar-custom flex max-h-40 flex-wrap justify-center gap-1.5 overflow-y-auto'>
      {shown.map(({ name, done }) => (
        <span
          key={name}
          className='bg-secondary text-md flex h-7 max-w-full items-center gap-1.5 truncate rounded-sm px-2.5 font-semibold'
        >
          {done && <Check className='h-3 w-3 shrink-0 text-green-400' aria-label='Done' />}
          {name}
        </span>
      ))}
      {(hiddenCount > 0 || isExpanded) && chips.length > max && (
        <button
          type='button'
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded(!isExpanded)}
          className='border-tertiary text-primary hover:border-primary-line hover:bg-primary-soft text-md flex h-7 cursor-pointer items-center rounded-sm border border-dashed px-2.5 font-semibold transition-colors'
        >
          {isExpanded ? 'Show less' : `+${hiddenCount} more`}
        </button>
      )}
    </div>
  )
}

export default NameChips
