'use client'

import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import Image from 'next/image'
import arrowDown from 'public/icons/arrow-down.svg'

interface CategoryFilterTabProps {
  setPanelCategories: () => void
}

const CategoryFilterTab: React.FC<CategoryFilterTabProps> = ({ setPanelCategories }) => {
  const { selectors } = useFilterRouter()
  const categories = selectors.filters.categories

  return (
    <div className='p-lg hover:bg-secondary w-full cursor-pointer rounded-sm' onClick={setPanelCategories}>
      <div className='flex cursor-pointer items-center justify-between'>
        <p className='text-lg leading-[18px] font-medium'>Category</p>
        <div className='flex items-center justify-end gap-x-2'>
          <p className='text-md text-neutral font-medium'>
            {categories.length > 0
              ? `${CATEGORY_LABELS[categories[0] as keyof typeof CATEGORY_LABELS]} ${categories.length > 1 ? `+${categories.length - 1}` : ''}`
              : null}
          </p>
          <Image src={arrowDown} alt='chevron up' className={`-rotate-90 transition-all`} />
        </div>
      </div>
    </div>
  )
}

export default CategoryFilterTab
