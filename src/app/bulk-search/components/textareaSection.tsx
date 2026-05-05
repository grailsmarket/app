'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectBulkSearch, setBulkSearchTerms } from '@/state/reducers/bulkSearch/bulkSearch'
import { useSearchParams } from 'next/navigation'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { cn } from '@/utils/tailwind'
import { formatNumber } from 'ethereum-identity-kit'

const MAX_NAMES = 10000

const TextareaSection: React.FC = () => {
  const dispatch = useAppDispatch()
  const { searchTerms } = useAppSelector(selectBulkSearch)
  const searchParams = useSearchParams()
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('')
  const [textareaValue, setTextareaValue] = useState('')

  // On mount, populate from URL terms param or existing Redux state
  useEffect(() => {
    const urlTerms = searchParams.get('terms')
    if (urlTerms) {
      const decoded = decodeURIComponent(urlTerms)
      setTextareaValue(decoded.split(',').join(', '))
      dispatch(setBulkSearchTerms(decoded))
    } else if (searchTerms) {
      setTextareaValue(searchTerms.split(',').join(', '))
    }
  }, [])

  const nameCount = useMemo(() => {
    if (!textareaValue.trim()) return 0
    return textareaValue
      .replace(/,/g, '\n')
      .replace(/ /g, '\n')
      .split('\n')
      .map((name) => name.trim())
      .filter((name) => name.length > 0).length
  }, [textareaValue])

  const isOverLimit = nameCount > MAX_NAMES
  const isDisabled = nameCount === 0 || isOverLimit || appliedSearchTerm === textareaValue

  const handleSearch = () => {
    if (isDisabled) return

    const names = textareaValue
      .replace(/,/g, '\n')
      .replace(/ /g, '\n')
      .split('\n')
      .map((name) => name.trim().replace('.eth', '').toLowerCase())
      .filter((name) => name.length > 0)

    const termsString = names.join(',')
    setAppliedSearchTerm(textareaValue)
    dispatch(setBulkSearchTerms(termsString))

    // Update URL with terms
    const url = new URL(window.location.href)
    url.searchParams.set('terms', termsString)
    window.history.replaceState({}, '', url.toString())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className='border-tertiary relative flex w-full flex-col gap-3 border-b-2 p-4'>
      <div className='bg-background pt-lg px-lg pb-md absolute top-4.5 left-4.5 flex w-[calc(100%-36px)] items-center justify-between gap-3'>
        <h1 className='text-xl font-bold sm:text-2xl'>Bulk Search</h1>
        <p className={`text-lg font-medium ${isOverLimit ? 'text-red-500' : 'opacity-50'}`}>
          {formatNumber(nameCount)} / {formatNumber(MAX_NAMES)} names
        </p>
      </div>
      <textarea
        value={textareaValue}
        onChange={(e) => setTextareaValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Enter up to 10,000 names separated by commas, spaces, or new lines'
        className='border-tertiary p-lg min-h-[180px] w-full resize-y rounded-sm border-2 bg-transparent pt-13 pb-16 text-lg transition-all outline-none hover:border-white/50 focus:border-white/80'
        rows={4}
      />
      <div className='p-md bg-background absolute right-6.5 bottom-6.5 flex items-center gap-2'>
        <button
          onClick={handleSearch}
          disabled={isDisabled}
          className='bg-primary hover:bg-primary/80 cursor-pointer rounded-sm px-6 py-2 text-lg font-semibold text-black transition-all disabled:cursor-not-allowed disabled:opacity-40'
        >
          Search
        </button>
        <SecondaryButton
          onClick={() => {
            setTextareaValue('')
            dispatch(setBulkSearchTerms(''))
            const url = new URL(window.location.href)
            url.searchParams.delete('terms')
            window.history.replaceState({}, '', url.toString())
          }}
          disabled={!textareaValue.trim()}
          className={cn(
            'cursor-pointer rounded-sm px-4 py-2 text-lg font-medium',
            !textareaValue.trim() && 'opacity-40'
          )}
        >
          Clear
        </SecondaryButton>
      </div>
    </div>
  )
}

export default TextareaSection
