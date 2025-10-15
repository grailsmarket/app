'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { setMarketplaceFiltersOpen } from '@/state/reducers/filters/marketplaceFilters'
import { useWindowSize } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'

const DomainPanel = () => {
  const dispatch = useAppDispatch()
  const { width: windowWidth } = useWindowSize()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, search, setSearch } = useDomains()

  return (
    <div
      className='flex flex-col gap-4 pt-lg'
      style={{
        width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
      }}
    >
      <div className='flex items-center gap-2 w-full justify-between md:px-md lg:px-lg'>
        <div className='flex items-center gap-2 w-auto'>
          <button className='lg:hidden h-10 w-10 border-[1px] border-foreground rounded-sm flex items-center justify-center opacity-70 hover:opacity-100 cursor-pointer transition-opacity' onClick={() => dispatch(setMarketplaceFiltersOpen(true))}><Image src={FilterIcon} alt='Filter' width={16} height={16} /></button>
          <div className='w-ful flex items-center justify-between group focus-within:border-primary/100! hover:border-primary/70 transition-all bg-transparent outline-none border-[2px] border-primary/40 rounded-sm p-md px-3'><input type='text' placeholder='Search' value={search} onChange={(e) => setSearch(e.target.value)} className='bg-transparent text-lg outline-none w-[200px] lg:w-[260px]' />
            <Image src={MagnifyingGlass} alt='Search' width={16} height={16} className='opacity-40 group-focus-within:opacity-100! group-hover:opacity-70 transition-opacity' />
          </div>
        </div>
        <ViewSelector />
      </div>
      <Domains
        maxHeight='calc(100vh - 160px)'
        domains={domains}
        loadingRowCount={20}
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
