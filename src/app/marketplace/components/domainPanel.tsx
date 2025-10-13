'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import DomainsTable from '@/components/domains/table'

const DomainPanel = () => {
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, search, setSearch } = useDomains()

  return (
    <div className='flex flex-col gap-4'
      style={{
        width: 'calc(100% - 280px)',
      }}>
      <div className='flex items-center gap-2 px-lg'>
        <input
          type='text'
          placeholder='Search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DomainsTable
        maxHeight='calc(100vh - 160px)'
        domains={domains}
        noResults={!domainsLoading && domains?.length === 0}
        listScrollTop={0}
        isLoading={domainsLoading}
        hasMoreDomains={hasMoreDomains}
        fetchMoreDomains={() => {
          if (hasMoreDomains) {
            fetchMoreDomains()
          }
        }}
      />
    </div>
  )
}

export default DomainPanel
