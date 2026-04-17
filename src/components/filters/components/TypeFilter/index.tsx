'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTypeFilters } from './hooks/useTypeFilters'
import UnexpandedFilter from '../UnexpandedFilter'
import TypeFilterDropdown from './TypeFilterDropdown'
import { MARKETPLACE_TYPE_FILTER_LABELS } from '@/constants/filters/name'
import { MarketplaceTypeFilterLabel } from '@/types/filters/name'

const TypeFilter = () => {
  const { getOption, setOption } = useTypeFilters()
  const filterLabels = MARKETPLACE_TYPE_FILTER_LABELS

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
      <div className='border-tertiary w-full'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='flex flex-col'>
            {filterLabels.map((label, index) => (
              <div key={label} className={`z-${filterLabels.length - index}`}>
                <TypeFilterDropdown
                  label={label}
                  value={getOption(label as MarketplaceTypeFilterLabel)}
                  onChange={(option) => setOption(label as MarketplaceTypeFilterLabel, option)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default TypeFilter
