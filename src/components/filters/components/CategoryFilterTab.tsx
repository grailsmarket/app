'use client'

import Image from 'next/image'
import chevronUp from '../../../../../public/svg/navigation/chevron-up.svg'

interface CategoryFilterTabProps {
  setPanelCategories: () => void
}

const CategoryFilterTab: React.FC<CategoryFilterTabProps> = ({
  setPanelCategories,
}) => {
  return (
    <div className="w-full bg-dark-700 p-4">
      <div className="h-4 overflow-y-hidden transition-all">
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={setPanelCategories}
        >
          <p className="pl-px text-xs font-medium leading-[18px]">Category</p>
          <Image
            src={chevronUp}
            alt="chevron up"
            className={`rotate-90 transition-all`}
          />
        </div>
      </div>
    </div>
  )
}

export default CategoryFilterTab
