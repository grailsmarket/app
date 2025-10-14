import Image from 'next/image'
import { MarketplaceOpenableFilterType } from '@/state/reducers/filters/marketplaceFilters'
import arrowDown from 'public/icons/arrow-down.svg'

interface UnexpandedFilterProps {
  label: MarketplaceOpenableFilterType
}

const UnexpandedFilter: React.FC<UnexpandedFilterProps> = ({ label }) => {
  return (
    <div className='w-full p-4'>
      <div className='h-4 overflow-y-hidden transition-all'>
        <div className='mb-4 flex cursor-pointer items-center justify-between'>
          <p className='text-xs leading-[18px] font-medium'>{label}</p>
          <Image src={arrowDown} alt='chevron up' />
        </div>
      </div>
    </div>
  )
}

export default UnexpandedFilter
