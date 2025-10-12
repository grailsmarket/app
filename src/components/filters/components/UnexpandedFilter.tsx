import Image from 'next/image'
import { MarketplaceOpenableFilterType } from '@/app/state/reducers/filters/marketplaceFilters'
import chevronUp from '../../../../../public/svg/navigation/chevron-up.svg'

interface UnexpandedFilterProps {
  label: MarketplaceOpenableFilterType
}

const UnexpandedFilter: React.FC<UnexpandedFilterProps> = ({ label }) => {
  return (
    <div className="w-full bg-dark-700 p-4">
      <div className="h-4 overflow-y-hidden transition-all">
        <div className="mb-4 flex cursor-pointer items-center justify-between">
          <p className="text-xs font-medium leading-[18px]">{label}</p>
          <Image
            src={chevronUp}
            alt="chevron up"
            className="rotate-180 transition-all"
          />
        </div>
      </div>
    </div>
  )
}

export default UnexpandedFilter
