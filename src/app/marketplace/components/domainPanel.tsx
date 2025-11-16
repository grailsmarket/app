'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useWindowSize } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import useScrollToBottom from '@/hooks/useScrollToBottom'

const DomainPanel = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { width: windowWidth } = useWindowSize()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useDomains()
  const isAtBottom = useScrollToBottom({ threshold: 10 })
  // const { viewType } = useAppSelector(selectMarketplaceDomains)

  return (
    <div
      className='sm:pt-lg flex w-full flex-col gap-3 overflow-hidden pt-3 sm:gap-4'
      style={{
        width: windowWidth ? (windowWidth < 1024 ? '100%' : 'calc(100% - 280px)') : '100%',
        maxHeight: windowWidth && windowWidth < 768 ? 'calc(100dvh - 62px)' : 'calc(100dvh - 80px)',
      }}
    >
      <div className='px-sm md:px-md lg:px-lg flex w-full items-center justify-between gap-2'>
        <div className='flex w-auto items-center gap-2'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 sm:h-10 sm:w-10 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='w-ful group border-tertiary flex h-9 items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:h-10'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search || ''}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-[200px] bg-transparent text-lg outline-none lg:w-[260px]'
            />
            <Image
              src={MagnifyingGlass}
              alt='Search'
              width={16}
              height={16}
              className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
            />
          </div>
        </div>
        <ViewSelector />
      </div>
      <Domains
        maxHeight={windowWidth && windowWidth < 768 ? 'calc(100dvh - 62px)' : 'calc(100dvh - 90px)'}
        domains={domains}
        loadingRowCount={20}
        paddingBottom='80px'
        noResults={!domainsLoading && domains?.length === 0}
        isLoading={domainsLoading}
        hasMoreDomains={hasMoreDomains}
        fetchMoreDomains={() => {
          if (hasMoreDomains && !domainsLoading) {
            fetchMoreDomains()
          }
        }}
        scrollEnabled={isAtBottom}
      />
    </div>
  )
}

export default DomainPanel
