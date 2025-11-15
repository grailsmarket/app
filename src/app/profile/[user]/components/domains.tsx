'use client'

import React from 'react'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { Address, Cross } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import { useProfileDomains } from '../hooks/useDomains'
import useScrollToBottom from '@/hooks/useScrollToBottom'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'

interface Props {
  user: Address | string
}

const DomainPanel: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useProfileDomains(user)
  const isAtBottom = useScrollToBottom({ threshold: 100 })
  const { viewType } = useAppSelector(selectMarketplaceDomains)

  return (
    <div className='sm:px-md px-sm flex flex-col gap-2'>
      <div className='md:p-md lg:px-lg flex w-full items-center justify-between gap-2'>
        <div className='px-sm flex w-auto items-center gap-2 md:p-0'>
          <button
            className='border-foreground flex md:h-10 h-9 md:w-10 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='w-ful group focus-within:border-white/50! hover:border-white/50 border-tertiary md:p-md h-9 flex items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-[200px] bg-transparent text-lg outline-none lg:w-[260px]'
            />
            {selectors.filters.search.length === 0 ? (
              <Image
                src={MagnifyingGlass}
                alt='Search'
                width={16}
                height={16}
                className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
              />
            ) : (
              <Cross
                onClick={() => dispatch(actions.setSearch(''))}
                className='h-4 w-4 cursor-pointer p-0.5 opacity-100 transition-opacity hover:opacity-70'
              />
            )}
          </div>
        </div>
        <ViewSelector />
      </div>
      <Domains
        maxHeight='calc(100dvh - 110px)'
        domains={domains}
        loadingRowCount={20}
        paddingBottom={viewType === 'list' ? '160px' : '120px'}
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
