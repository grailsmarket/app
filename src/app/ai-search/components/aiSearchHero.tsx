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
    <section className="bg-background relative flex w-full flex-col justify-center overflow-hidden border-b-2 border-tertiary px-4 py-12 md:py-16 lg:py-20">
      <div className="pointer-events-none absolute top-0 right-0 bottom-0 z-0 w-full opacity-20 md:w-1/2 md:opacity-40 lg:w-2/5">
        <AiChipAnimation />
      </div>

      <div className="fadeIn relative z-10 flex w-full flex-col items-start gap-5 text-left">
        <h1 className="font-sedan-sc text-primary text-4xl md:text-5xl lg:text-6xl">
          Grails AI
        </h1>
        <p className="text-neutral max-w-md text-lg md:text-xl">
          Find your next grail with the help of AI
        </p>

        <div className="flex w-full max-w-lg flex-row gap-0 pt-2">
          <div className="group hover:bg-secondary border-tertiary focus-within:border-primary relative flex flex-1 items-center border-2 border-r-0 bg-transparent transition-all">
            <div className="pointer-events-none absolute left-3 flex h-5 w-5 items-center justify-center">
              <Image
                src={MagnifyingGlass}
                alt=""
                width={16}
                height={16}
                className="opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-70"
              />
            </div>
            <input
              type="text"
              placeholder="Describe the name you are looking for..."
              value={localSearch}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 w-full rounded-l-md bg-transparent pl-10 pr-3 text-lg outline-none md:h-14"
            />
          </div>
          <button
            onClick={() => submitSearch(localSearch)}
            className="bg-primary text-background hover:bg-primary/90 flex h-12 cursor-pointer items-center rounded-r-md px-6 text-lg font-semibold transition-colors md:h-14"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  )
}

export default AiSearchHero
