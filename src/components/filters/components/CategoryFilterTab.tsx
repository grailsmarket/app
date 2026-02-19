'use client'

import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import Image from 'next/image'
import arrowDown from 'public/icons/arrow-down.svg'
import { useCategories } from '../hooks/useCategories'
import { useFilterContext } from '@/context/filters'

interface CategoryFilterTabProps {
  setPanelCategories: () => void
}

const CategoryFilterTab: React.FC<CategoryFilterTabProps> = ({ setPanelCategories }) => {
  const { categories } = useCategories()
  const { selectors } = useFilterRouter()
  const { filterType } = useFilterContext()
  const selectedCategories = selectors.filters.categories

  if (filterType === 'category') return null

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
                : `${categories?.find((c) => c.name === selectedCategories[0])?.display_name} ${selectedCategories.length > 1 ? `+${selectedCategories.length - 1}` : ''}`
              : null}
          </p>
          <Image src={arrowDown} alt='chevron up' className={`-rotate-90 transition-all`} />
        </div>
      </div>
    </div>
  )
}

export default CategoryFilterTab
