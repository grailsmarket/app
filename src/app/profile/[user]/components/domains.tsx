'use client'

import React from 'react'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { Address } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import { useProfileDomains } from '../hooks/useDomains'

interface Props {
  user: Address | string
}

const DomainPanel: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useProfileDomains(user)

  return (
    <>
      <div className='md:px-md lg:px-lg flex w-full items-center justify-between gap-2'>
        <div className='flex w-auto items-center gap-2'>
          <button
            className='border-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='w-ful group focus-within:border-primary/100! hover:border-primary/70 border-primary/40 p-md flex items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
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
        maxHeight='calc(100vh - 200px)'
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
    </>
  )
}

export default DomainPanel
