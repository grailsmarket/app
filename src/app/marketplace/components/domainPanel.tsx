'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import DomainsTable from '@/components/domains/table'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { setMarketplaceFiltersOpen } from '@/state/reducers/filters/marketplaceFilters'
import { useWindowSize } from 'ethereum-identity-kit'

const DomainPanel = () => {
  const { width: windowWidth } = useWindowSize()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, search, setSearch } = useDomains()
  const dispatch = useAppDispatch()

  return (
    <div
      className='flex flex-col gap-4 pt-lg'
      style={{
        width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
      }}
    >
      <div className='lg:px-lg flex items-center gap-2 w-full justify-between'>
        <div className='flex items-center gap-2'>
          <button className='lg:hidden h-10 w-10 border-[1px] border-foreground rounded-sm flex items-center justify-center hover:bg-foreground/20 cursor-pointer transition-colors' onClick={() => dispatch(setMarketplaceFiltersOpen(true))}><Image src={FilterIcon} alt='Filter' width={16} height={16} /></button>
          <input type='text' placeholder='Search' value={search} onChange={(e) => setSearch(e.target.value)} className='bg-transparent outline-none border-[2px] border-primary/40 rounded-sm p-md' />
        </div>
        <ViewSelector />
      </div>
      <DomainsTable
        maxHeight='calc(100vh - 160px)'
        domains={domains}
        loadingRowCount={16}
        noResults={!domainsLoading && domains?.length === 0}
        isLoading={domainsLoading}
        hasMoreDomains={hasMoreDomains}
        fetchMoreDomains={() => {
          if (hasMoreDomains && !domainsLoading) {
            fetchMoreDomains()
          }
        }}
      />
    </div>
  )
}

export default DomainPanel
