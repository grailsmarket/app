'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import AiChipAnimation from '@/components/ui/aiChipAnimation'
import MagnifyingGlass from 'public/icons/search.svg'

const SEARCH_DEBOUNCE_MS = 400

const AiSearchHero: React.FC = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const [localSearch, setLocalSearch] = useState(selectors.filters.search || '')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const userHasTyped = useRef(false)

  useEffect(() => {
    if (!userHasTyped.current) {
      setLocalSearch(selectors.filters.search || '')
    }
  }, [selectors.filters.search])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const submitSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    dispatch(actions.setSearch(value))
  }

  const handleInputChange = (value: string) => {
    userHasTyped.current = true
    setLocalSearch(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      dispatch(actions.setSearch(value))
    }, SEARCH_DEBOUNCE_MS)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      submitSearch(localSearch)
    }
  }

  return (
    <section className='bg-background border-tertiary relative flex w-full flex-col justify-center overflow-hidden border-b-2 px-4 py-8 md:py-12 lg:py-20'>
      <div className='pointer-events-none absolute top-0 right-0 z-0 hidden h-full w-fit lg:block'>
        <AiChipAnimation />
      </div>

      <div className='pointer-events-none absolute -top-[20%] -left-[50%] h-fit md:-top-[50%] md:-left-[30%] lg:hidden'>
        <div className='background-radial-primary h-[300px] w-[300px] md:h-[500px] md:w-[500px]' />
      </div>
      <div className='pointer-events-none absolute -top-[20%] -right-[60%] h-fit md:-top-[50%] md:-right-[33%] lg:hidden'>
        <div className='background-radial-primary h-[300px] w-[300px] md:h-[500px] md:w-[500px]' />
      </div>

      <div className='fadeIn relative z-10 flex w-full flex-col items-center gap-5 text-left lg:items-start lg:pl-6 xl:pl-12'>
        <h1 className='font-sedan-sc text-primary text-4xl md:text-5xl lg:text-6xl'>Grails AI</h1>
        <p className='text-neutral max-w-md text-lg md:text-xl'>Find your next grail with the help of AI</p>

        <div className='flex w-full max-w-lg flex-row gap-0 pt-2'>
          <div className='group hover:bg-secondary border-tertiary focus-within:border-primary relative flex flex-1 items-center rounded-l-sm border-r-0 bg-transparent transition-all'>
            <div className='pointer-events-none absolute left-3 flex h-5 w-5 items-center justify-center'>
              <Image
                src={MagnifyingGlass}
                alt=''
                width={16}
                height={16}
                className='opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-70'
              />
            </div>
            <input
              type='text'
              placeholder='Describe the name you are looking for...'
              value={localSearch}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className='border-tertiary h-12 w-full rounded-l-md border-2 bg-transparent pr-3 pl-10 text-xl font-medium outline-none md:h-14'
            />
          </div>
          <button
            onClick={() => submitSearch(localSearch)}
            className='bg-primary text-background hover:bg-primary/90 flex h-12 cursor-pointer items-center rounded-r-md px-6 text-xl font-semibold transition-colors md:h-14'
          >
            Search
          </button>
        </div>
      </div>
    </section>
  )
}

export default AiSearchHero
