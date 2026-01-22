'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useOfferFilter } from './hooks/useOfferFilter'

import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'

const OfferFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Offer')
  const { offerRange, currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMaxOffer, setMinOffer } =
    useOfferFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Offer' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={112}
        label='Offer'
        CustomComponent={
          <p className='text-md text-neutral font-medium'>
            {offerRange?.min || offerRange?.max ? `${offerRange.min || ''} - ${offerRange.max || ''}` : null}
          </p>
        }
      >
        <div className='px-lg py-md flex w-full flex-row items-center justify-between'>
          <p className='text-lg font-medium'>Offer</p>
          <div className='flex w-2/3 flex-row gap-x-2'>
            <input
              type='text'
              inputMode='decimal'
              className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
              placeholder='Min'
              value={currMinVal ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                  setCurrMinVal(val === '' ? null : val)
                }
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value)
                setMinOffer(isNaN(num) ? 0 : num)
              }}
            />
            <input
              type='text'
              inputMode='decimal'
              className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
              placeholder='Max'
              value={currMaxVal ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                  setCurrMaxVal(val === '' ? null : val)
                }
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value)
                setMaxOffer(isNaN(num) ? 0 : num)
              }}
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default OfferFilter
