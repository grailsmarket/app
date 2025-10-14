import { MouseEventHandler } from 'react'
import Image from 'next/image'

import tick from 'public/icons/tick.svg'
import { cn } from '@/utils/tailwind'

interface FilterSelectorProps {
  onClick: () => void
  isActive: boolean
}

const FilterSelector: React.FC<FilterSelectorProps> = ({ onClick, isActive }) => {
  return (
    <button onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}>
      <div
        className={cn(
          'relative h-5 w-5 cursor-pointer rounded-sm border-2 transition duration-75',
          isActive ? 'border-primary bg-primary' : 'border-primary/40 hover:bg-primary/40'
        )}
      >
        <Image
          src={tick}
          alt='filter active'
          className={cn(
            'absolute top-[50%] left-[50%] z-10 h-auto w-4 -translate-x-[50%] -translate-y-[50%] transition duration-75',
            isActive ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>
    </button>
  )
}

export default FilterSelector
