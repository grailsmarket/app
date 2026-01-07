'use client'

import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import Image from 'next/image'
import arrowDown from 'public/icons/arrow-down.svg'
import { useCategories } from '../hooks/useCategories'

interface CategoryFilterTabProps {
  setPanelCategories: () => void
}

const CategoryFilterTab: React.FC<CategoryFilterTabProps> = ({ setPanelCategories }) => {
  const { selectors } = useFilterRouter()
  const { categories } = useCategories()
  const selectedCategories = selectors.filters.categories

  return (
    <div
      className='p-lg hover:bg-secondary border-tertiary w-full cursor-pointer rounded-sm border-b'
      onClick={setPanelCategories}
    >
      <div className='flex cursor-pointer items-center justify-between'>
        <p className='text-lg leading-[18px] font-medium'>Categories</p>
        <div className='flex items-center justify-end gap-x-2'>
          <p className='text-md text-neutral font-medium'>
            {selectedCategories.length > 0
              ? selectedCategories.length === categories?.length
                ? 'All'
                : `${CATEGORY_LABELS[selectedCategories[0] as keyof typeof CATEGORY_LABELS]} ${selectedCategories.length > 1 ? `+${selectedCategories.length - 1}` : ''}`
              : null}
          </p>
          <Image src={arrowDown} alt='chevron up' className={`-rotate-90 transition-all`} />
        </div>
      </div>
    </div>
  )
}

export default CategoryFilterTab
