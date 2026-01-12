'use client'

import React from 'react'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import SortDropdown from '@/components/domains/sortDropdown'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import MagnifyingGlass from 'public/icons/search.svg'
import { useCategoryDomains } from '../hooks/useDomains'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import { selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { SelectAllProvider } from '@/context/selectAll'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserContext } from '@/context/user'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import BulkSelect from '@/components/ui/bulkSelect'

interface Props {
  category: string
}

const DomainPanel: React.FC<Props> = ({ category }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const { domains, categoryDomainsLoading, fetchMoreCategoryDomains, hasMoreCategoryDomains, totalCategoryDomains } =
    useCategoryDomains(category)
  const { isNavbarVisible } = useNavbar()
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { authStatus } = useUserContext()
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  const content = (
    <>
      <div
        className={cn(
          'py-md md:py-lg px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
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
          <div className='group border-tertiary flex h-9 w-[calc(100%-39px)] items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:w-fit md:h-10'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
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
        paddingBottom={isSelecting ? '160px' : '120px'}
        filtersOpen={filtersOpen}
        noResults={!categoryDomainsLoading && domains?.length === 0}
        isLoading={categoryDomainsLoading}
        hasMoreDomains={hasMoreCategoryDomains}
        fetchMoreDomains={() => {
          if (hasMoreCategoryDomains && !categoryDomainsLoading) {
            fetchMoreCategoryDomains()
          }
        }}
        isBulkSelecting={isSelecting}
      />
    </>
  )

  // Wrap with SelectAllProvider
  return (
    <SelectAllProvider
      loadedDomains={domains}
      totalCount={totalCategoryDomains}
      filters={selectors.filters as MarketplaceFiltersState}
      searchTerm={debouncedSearch}
      category={category}
      isAuthenticated={authStatus === 'authenticated'}
    >
      {content}
      <BulkSelect pageType='category' />
    </SelectAllProvider>
  )
}

export default DomainPanel
