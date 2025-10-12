'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { persistor } from '../../../../../state/index'
import { useLengthFilter } from './hooks/useLengthFilter'
import { useFilterOpen } from '../../hooks/useFilterOpen'

import RangeSelect from '@/app/ui/RangeSelect'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/app/ui/ExpandableTab'

import { MARKETPLACE_LENGTH_VALUES } from '@/app/constants/filters/marketplaceFilters'

const LengthFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Length')
  const { minVal, maxVal, onChange } = useLengthFilter()

  return (
    <PersistGate
      persistor={persistor}
      loading={<UnexpandedFilter label="Length" />}
    >
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        label="Length"
        expandedHeight={72}
      >
        <div className="flex flex-col gap-y-4">
          <RangeSelect
            values={[...MARKETPLACE_LENGTH_VALUES]}
            minVal={minVal}
            maxVal={maxVal}
            onChange={onChange}
          />
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default LengthFilter
