import { PersistGate } from 'redux-persist/integration/react'

import { useActivityFilters } from '../../hooks/useActivityFilters'
import { persistor } from '@/app/state'

import Switch from '@/app/ui/Switch'
import UnexpandedFilter from '../../../UnexpandedFilter'

import { PORTFOLIO_ACTIVITY_FILTER_LABELS } from '@/app/constants/filters/marketplaceFilters'

const TypeFilter = () => {
  const { isActive, toggleActive } = useActivityFilters()

  return (
    <div className="flex flex-col bg-dark-700 p-4">
      <PersistGate
        persistor={persistor}
        loading={<UnexpandedFilter label="Status" />}
      >
        <div className="w-full pb-3">
          <div className="flex w-full flex-col gap-3">
            <p className="text-xs font-medium leading-[18px]">Type</p>
            <div className="mb-4 h-px w-full bg-dark-500" />
          </div>
        </div>
        <div className="flex flex-col gap-y-4 overflow-x-hidden">
          {PORTFOLIO_ACTIVITY_FILTER_LABELS.map((label, index) => (
            <div key={index} className="flex justify-between">
              <p className="text-xs font-medium text-light-200">{label}</p>
              <Switch
                isActive={isActive(label)}
                onChange={toggleActive(label)}
              />
            </div>
          ))}
        </div>
      </PersistGate>
    </div>
  )
}

export default TypeFilter
