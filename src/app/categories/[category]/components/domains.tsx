'use client'

import React from 'react'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import MagnifyingGlass from 'public/icons/search.svg'
import { useCategoryDomains } from '../hooks/useDomains'
import useScrollToBottom from '@/hooks/useScrollToBottom'

interface Props {
  category: string
}

const DomainPanel: React.FC<Props> = ({ category }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { domains, categoryDomainsLoading, fetchMoreCategoryDomains, hasMoreCategoryDomains } =
    useCategoryDomains(category)
  const isAtBottom = useScrollToBottom({ threshold: 10 })

  return (
    <>
      <div className='px-sm md:px-md lg:px-lg md:pt-lg flex w-full items-center justify-between gap-2 pt-3'>
        <div className='flex w-auto items-center gap-2'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 md:h-10 md:w-10 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='w-ful group border-tertiary flex h-9 items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 md:h-10'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-[160px] bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
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
        maxHeight='calc(100dvh - 100px)'
        domains={domains}
        loadingRowCount={20}
        paddingBottom='100px'
        noResults={!categoryDomainsLoading && domains?.length === 0}
        isLoading={categoryDomainsLoading}
        hasMoreDomains={hasMoreCategoryDomains}
        fetchMoreDomains={() => {
          if (hasMoreCategoryDomains && !categoryDomainsLoading) {
            fetchMoreCategoryDomains()
          }
        }}
        scrollEnabled={isAtBottom}
      />
    </>
  )
}

export default DomainPanel
