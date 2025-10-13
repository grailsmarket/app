'use client'

import Image from 'next/image'
import arrowDown from 'public/icons/arrow-down.svg'

interface CategoryFilterTabProps {
  setPanelCategories: () => void
}

const CategoryFilterTab: React.FC<CategoryFilterTabProps> = ({
  setPanelCategories,
}) => {
  return (
    <div className="w-full p-4">
      <div className="h-4 overflow-y-hidden transition-all">
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={setPanelCategories}
        >
          <p className="pl-px text-xs font-medium leading-[18px]">Category</p>
          <Image
            src={arrowDown}
            alt="chevron up"
            className={`-rotate-90 transition-all`}
          />
        </div>
      </div>
    </div>
  )
}

export default CategoryFilterTab
