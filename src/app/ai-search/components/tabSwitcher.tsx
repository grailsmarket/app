'use client'

import { cn } from '@/utils/tailwind'
import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import FilterIcon from 'public/icons/filter.svg'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeAiSearchTab, selectAiSearch } from '@/state/reducers/aiSearch/aiSearch'
import { AI_SEARCH_TABS, AiSearchTabType } from '@/constants/domains/aiSearch/tabs'
import { useNavbar } from '@/context/navbar'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import DownloadButton from '@/components/ui/downloadButton'
import ViewSelector from '@/components/domains/viewSelector'

const AiSearchTabSwitcher: React.FC = () => {
  const [mounted, setMounted] = useState(false)
  const { selectedTab } = useAppSelector(selectAiSearch)
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const { selectors, actions } = useFilterRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const setAiSearchTab = (tab: AiSearchTabType) => {
    dispatch(changeAiSearchTab(tab))
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !mounted) return

    const activeIndex = AI_SEARCH_TABS.findIndex((tab) => tab.value === selectedTab.value)
    if (activeIndex === -1) {
      setIndicatorStyle({ left: 0, width: 0 })
      return
    }

    const buttons = container.querySelectorAll('button')
    const activeButton = buttons[activeIndex] as HTMLElement | undefined
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }
  }, [selectedTab, mounted])

  return (
    <div
      className={cn(
        'bg-background pr-lg border-tertiary xs:text-lg text-md xs:gap-2 sticky z-10 flex min-h-12 max-w-full items-center justify-between gap-2 overflow-x-auto border-b-2 transition-[top] duration-300 sm:pr-0 sm:text-xl md:min-h-14 lg:gap-4',
        isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0'
      )}
    >
      <div className='flex items-center'>
        <button
          className='border-tertiary bg-background hover:bg-secondary sticky left-0 z-10 flex h-12 min-h-12 w-12 min-w-12 cursor-pointer items-center justify-center border-r-2 transition-all md:h-14 md:min-h-14 md:w-10 md:min-w-14'
          onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
        >
          <Image src={FilterIcon} alt='Filter' width={20} height={20} className='opacity-40' />
        </button>
        {/* <div className='group hover:bg-secondary border-primary/50 hover:border-primary/80 focus-within:border-primary/80 relative flex min-h-14 w-40 items-center justify-between gap-1.5 border-[2px] bg-transparent px-3 transition-all outline-none sm:h-10 sm:w-56 md:w-64'>
          <div className='absolute top-1/2 left-3 z-10 h-6 w-6 -translate-y-1/2'>
            <Tooltip label='Search with AI' position='bottom'>
              <Image src={GrailsAI} alt='Grails AI' width={20} height={20} className='h-6 w-6' />
            </Tooltip>
          </div>
          <input
            type='text'
            placeholder='Search with AI'
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                dispatch(actions.setSearch(localSearch))
                e.currentTarget.blur()
              }
            }}
            className='h-12 w-full bg-transparent pl-9 text-xl outline-none'
          />
          {localSearch.length > 0 ? (
            <Cross
              onClick={clearSearch}
              className='h-4 w-4 cursor-pointer p-0.5 opacity-100 transition-opacity hover:opacity-70'
            />
          ) : (
            <Image
              src={MagnifyingGlass}
              alt='Search'
              width={16}
              height={16}
              className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
            />
          )}
        </div> */}

        <div ref={containerRef} className='pl-lg relative flex h-10 gap-4'>
          {mounted && (
            <div
              className='bg-primary absolute bottom-1.5 h-0.5 rounded-full transition-all duration-300 ease-out'
              style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            />
          )}
          {AI_SEARCH_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setAiSearchTab(tab)}
              className={cn(
                'py-md flex w-full cursor-pointer flex-row items-center justify-center gap-1 text-lg sm:w-fit',
                selectedTab.value === tab.value
                  ? 'text-primary font-bold opacity-100'
                  : 'font-semibold opacity-50 transition-colors hover:opacity-80'
              )}
            >
              <p className='text-lg text-nowrap sm:text-xl'>{tab.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className='hidden items-center md:flex'>
        <DownloadButton />
        <ViewSelector />
      </div>
    </div>
  )
}

export default AiSearchTabSwitcher
