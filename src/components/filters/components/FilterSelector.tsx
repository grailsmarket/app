import { MouseEventHandler } from 'react'
import Image from 'next/image'

import tick from 'public/icons/tick.svg'
import { cn } from '@/utils/tailwind'

interface FilterSelectorProps {
  onClick: MouseEventHandler<HTMLButtonElement>
  isActive: boolean
}

const FilterSelector: React.FC<FilterSelectorProps> = ({
  onClick,
  isActive,
}) => {
  return (
    <button onClick={onClick}>
      <div
        className={cn('relative h-5 w-5 border-2 transition duration-75 rounded-sm cursor-pointer',
          isActive ? 'border-primary bg-primary' : 'border-primary/40 hover:bg-primary/40'
        )}
      >
        <Image
          src={tick}
          alt="filter active"
          className={cn('absolute left-[50%] top-[50%] w-4 z-10 h-auto -translate-x-[50%] -translate-y-[50%] transition duration-75',
            isActive ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
    </button>
  )
}

export default FilterSelector
