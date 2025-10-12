import { MouseEventHandler } from 'react'
import Image from 'next/image'

import whiteTick from '../../../../../../../public/svg/filters/white-tick.svg'
import whiteBar from '../../../../../../../public/svg/filters/white-bar.svg'

interface FilterSelectorProps {
  onClick: MouseEventHandler<HTMLButtonElement>
  isActive: boolean
  isTick?: boolean
  radio?: boolean
}

const FilterSelector: React.FC<FilterSelectorProps> = ({
  onClick,
  isActive,
  isTick,
  radio,
}) => {
  const src = isTick ? whiteTick : whiteBar

  return (
    <button onClick={onClick}>
      <div
        className={`relative h-4 w-4 border-[1px] transition duration-75 ${
          radio
            ? 'flex items-center justify-center rounded-full '
            : 'rounded-sm'
        } ${
          isActive ? 'border-purple bg-purple' : 'border-dark-300 bg-dark-850'
        }`}
      >
        {radio ? (
          <div
            className={`h-2 w-2 rounded-full bg-white transition duration-75 ${
              isActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <Image
            src={src}
            alt="filter active"
            className={`absolute left-[50%] top-[50%] z-10 h-auto -translate-x-[50%] -translate-y-[50%] transition duration-75 ${
              isActive ? 'opacity-1' : 'opacity-0'
            } ${isTick ? 'w-[10.5px]' : 'w-[8px]'}`}
          />
        )}
      </div>
    </button>
  )
}

export default FilterSelector
