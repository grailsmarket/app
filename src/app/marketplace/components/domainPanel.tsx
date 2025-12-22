'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import useScrollToBottom from '@/hooks/useScrollToBottom'
import { useRouter } from 'next/navigation'
import { normalizeName } from '@/lib/ens'

const DomainPanel = () => {
  const router = useRouter()
  const isClient = useIsClient()
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { width: windowWidth } = useWindowSize()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useDomains()
  const isAtBottom = useScrollToBottom({ threshold: 30 })

  return (
    <div
      className='sm:pt-lg pt-md px-sm flex w-full flex-col gap-2 overflow-hidden'
      style={{
        maxHeight: isClient
          ? windowWidth && windowWidth < 768
            ? 'calc(100dvh - 106px)'
            : 'calc(100dvh - 120px)'
          : 'calc(100dvh - 106px)',
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
          <div className='w-ful group border-tertiary flex h-9 items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:h-10'>
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
        maxHeight={windowWidth && windowWidth > 768 ? 'calc(100dvh - 160px)' : 'calc(100dvh - 128px)'}
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
