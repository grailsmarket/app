'use client'

import React, { useState } from 'react'

interface NameChipsProps {
  names: string[]
  /** Chips shown before "+N more". */
  max?: number
}

const NameChips: React.FC<NameChipsProps> = ({ names, max = 4 }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const shown = isExpanded ? names : names.slice(0, max)
  const hiddenCount = names.length - shown.length

  return (
    <div className='scrollbar-custom flex max-h-40 flex-wrap justify-center gap-1.5 overflow-y-auto'>
      {shown.map((name) => (
        <span
          key={name}
          className='bg-secondary text-md flex h-7 max-w-full items-center truncate rounded-sm px-2.5 font-semibold'
        >
          {name}
        </span>
      ))}
      {(hiddenCount > 0 || isExpanded) && names.length > max && (
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
