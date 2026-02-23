'use client'

import { useState } from 'react'
import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useCreationDateFilter } from './hooks/useCreationDateFilter'

import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'
import DatePicker from '@/components/ui/datepicker'
import { Cross } from 'ethereum-identity-kit'

const CreationDateFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Creation Date')
  const { currMinVal, currMaxVal, setMinDate, setMaxDate, minDateObj, maxDateObj } = useCreationDateFilter()

  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)

  const handleFromSelect = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    setMinDate(`${yyyy}-${mm}-${dd}`)
    setShowFromPicker(false)
  }

  const handleToSelect = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    setMaxDate(`${yyyy}-${mm}-${dd}`)
    setShowToPicker(false)
  }

  const formatDisplay = (dateStr: string | null) => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-')
    return `${m}/${d}/${y}`
  }

  const summary =
    currMinVal || currMaxVal ? `${formatDisplay(currMinVal) || ''} - ${formatDisplay(currMaxVal) || ''}` : null

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Creation Date' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={showFromPicker || showToPicker ? 420 : 112}
        label='Creation Date'
        CustomComponent={summary ? <p className='text-md text-neutral font-medium'>{summary}</p> : null}
      >
        <div className='px-lg py-md flex w-full gap-2 md:flex-col'>
          <div>
            <p className='text-lg font-medium'>Creation Date</p>
          </div>
          <div className='flex gap-2'>
            <div className='relative w-1/2'>
              <button
                onClick={() => {
                  setShowFromPicker(!showFromPicker)
                  setShowToPicker(false)
                }}
                className='border-primary/20 p-md hover:bg-secondary w-full cursor-pointer rounded-sm border-2 text-left text-lg transition-colors outline-none'
              >
                {currMinVal ? formatDisplay(currMinVal) : <span className='text-neutral'>Min date</span>}
              </button>
              {currMinVal && (
                <div
                  className='absolute top-[15px] right-3 cursor-pointer transition-opacity hover:opacity-80'
                  onClick={() => setMinDate(null)}
                >
                  <Cross width={12} height={12} />
                </div>
              )}
            </div>
            <div className='relative w-1/2'>
              <button
                onClick={() => {
                  setShowToPicker(!showToPicker)
                  setShowFromPicker(false)
                }}
                className='border-primary/20 p-md hover:bg-secondary w-full cursor-pointer rounded-sm border-2 text-left text-lg transition-colors outline-none'
              >
                {currMaxVal ? formatDisplay(currMaxVal) : <span className='text-neutral'>Max date</span>}
              </button>
              {currMaxVal && (
                <div
                  className='absolute top-[15px] right-3 cursor-pointer transition-opacity hover:opacity-80'
                  onClick={() => setMaxDate(null)}
                >
                  <Cross width={12} height={12} />
                </div>
              )}
            </div>
          </div>
          {(showFromPicker || showToPicker) && (
            <div className='fixed top-0 left-0 z-[1000] flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-sm'>
              <DatePicker
                onSelect={showFromPicker ? handleFromSelect : handleToSelect}
                onClose={() => {
                  setShowFromPicker(false)
                  setShowToPicker(false)
                }}
                maxDate={maxDateObj}
                minDate={minDateObj}
                currentDate={
                  showFromPicker
                    ? currMinVal
                      ? new Date(currMinVal + 'T00:00:00')
                      : null
                    : currMaxVal
                      ? new Date(currMaxVal + 'T00:00:00')
                      : null
                }
                hideTime
                className='w-[350px]'
              />
            </div>
          )}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default CreationDateFilter
