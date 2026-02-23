import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useEffect, useState, useRef } from 'react'

export const useCreationDateFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<string | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const isInitialSync = useRef(true)

  const creationDate = (selectors.filters as { creationDate?: { min: string | null; max: string | null } }).creationDate

  const minVal = creationDate?.min ?? null
  const maxVal = creationDate?.max ?? null

  // Sync local state from Redux when Redux changes externally (e.g., from URL or clear filters)
  useEffect(() => {
    if (
      isInitialSync.current ||
      (minVal !== currMinVal && minVal !== null) ||
      (minVal === null && currMinVal !== null)
    ) {
      setCurrMinVal(minVal)
    }
    if (
      isInitialSync.current ||
      (maxVal !== currMaxVal && maxVal !== null) ||
      (maxVal === null && currMaxVal !== null)
    ) {
      setCurrMaxVal(maxVal)
    }

    if (isInitialSync.current) {
      isInitialSync.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal])

  const setMinDate = (date: string | null) => {
    setCurrMinVal(date)
    dispatch((actions as any).setCreationDate({ min: date, max: creationDate?.max ?? null }))
  }

  const setMaxDate = (date: string | null) => {
    setCurrMaxVal(date)
    dispatch((actions as any).setCreationDate({ min: creationDate?.min ?? null, max: date }))
  }

  // Convert YYYY-MM-DD string to Date object for DatePicker constraints
  const minDateObj = currMinVal ? new Date(currMinVal + 'T00:00:00') : undefined
  const maxDateObj = currMaxVal ? new Date(currMaxVal + 'T00:00:00') : new Date()

  return {
    creationDate,
    currMinVal,
    currMaxVal,
    setMinDate,
    setMaxDate,
    minDateObj,
    maxDateObj,
  }
}
