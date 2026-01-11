'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import SortDropdown from '@/components/domains/sortDropdown'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import MagnifyingGlass from 'public/icons/search.svg'
import { useRouter } from 'next/navigation'
import { normalizeName } from '@/lib/ens'
import { useNavbar } from '@/context/navbar'
import { cn } from '@/utils/tailwind'

const DomainPanel = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useDomains()
  const { isNavbarVisible } = useNavbar()

  return (
    <div className='z-0 flex w-full flex-col'>
      <div
        className={cn(
          'py-md md:py-lg px-md transition-top lg:px-lg bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='flex w-full items-center gap-2 sm:w-fit'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='group border-tertiary flex h-9 w-[calc(100%-39px)] items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:h-10 sm:w-fit'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search || ''}
              onChange={(e) => {
                dispatch(actions.setSearch(e.target.value))
                // router.push(`/marketplace`)

                const searchTerm = e.target.value.toLowerCase().trim()
                if (searchTerm.length === 0) {
                  router.push('/marketplace')
                  return
                }

                const isBulkSearching = searchTerm.replaceAll(' ', ',').split(',').length > 1
                if (isBulkSearching) {
                  router.push(
                    `/marketplace?search=${searchTerm
                      .replaceAll(' ', ',')
                      .split(',')
                      .map((query) => normalizeName(query.toLowerCase().trim()))
                      .filter((query) => query.length > 2)
                      .join(',')}`
                  )
                } else {
                  router.push(`/marketplace?search=${normalizeName(searchTerm)}`)
                }
              }}
              className='w-full bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
            />
            <Image
              src={MagnifyingGlass}
              alt='Search'
              width={16}
              height={16}
              className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
            />
          </div>
          <div className='hidden sm:block'>
            <SortDropdown />
          </div>
        </div>
        <div className='flex w-full items-center justify-between gap-2 sm:w-fit sm:justify-end'>
          <div className='block sm:hidden'>
            <SortDropdown />
          </div>
          <ViewSelector />
        </div>
      </div>
      <Domains
        domains={domains}
        loadingRowCount={20}
        paddingBottom='80px'
        filtersOpen={filtersOpen}
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
