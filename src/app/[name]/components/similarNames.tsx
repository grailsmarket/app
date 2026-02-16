'use client'

import React from 'react'
import { useSimilarNames } from '../hooks/useSimilarNames'
import TableRow from '@/components/domains/table/components/TableRow'
import { MarketplaceHeaderColumn } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import LoadingCell from '@/components/ui/loadingCell'

interface Props {
  name: string
  categories?: string[]
}

// Columns to display in list view for similar names
const SIMILAR_NAMES_COLUMNS: MarketplaceHeaderColumn[] = ['domain', 'price', 'owner', 'actions']

const SimilarNames: React.FC<Props> = ({ name, categories }) => {
  const { domains, isLoading, loadingPhase, error } = useSimilarNames(name, categories)

  // Don't render if there's an error or no results after loading
  if (error || (!isLoading && domains.length === 0)) {
    return null
  }

  return (
    <div className='sm:border-tertiary bg-secondary pt-lg lg:pt-xl flex w-full flex-col gap-1 sm:rounded-lg sm:border-2 lg:gap-4'>
      <div className='px-lg xl:px-xl flex items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Recommended</h2>
        <span className='text-neutral text-lg'>GrailsAI (beta)</span>
      </div>

      <div className='relative w-full'>
        {/* Table Header */}
        <div className='border-tertiary px-md md:p-md lg:p-lg hidden h-[40px] w-full flex-row items-center justify-between border-b sm:flex'>
          {SIMILAR_NAMES_COLUMNS.map((column) => (
            <div
              key={column}
              className={cn(
                'text-neutral text-sm font-medium',
                column === 'domain' && 'w-[35%]',
                column === 'price' && 'w-[25%]',
                column === 'owner' && 'w-[25%]',
                column === 'actions' && 'w-[15%] text-right'
              )}
            >
              {column === 'domain' ? 'Name' : column === 'price' ? 'Price' : column === 'owner' ? 'Owner' : ''}
            </div>
          ))}
        </div>

        {/* Loading overlay - maintains same height as 20 rows */}
        {isLoading ? (
          <div className='flex h-[300px] w-full animate-pulse flex-col items-center justify-center gap-3'>
            <LoadingCell height='20px' width='140px' radius='4px' />
            <span className='text-neutral text-lg'>
              {loadingPhase === 'ai' ? 'AI Thinking...' : 'Loading name data...'}
            </span>
          </div>
        ) : (
          // Loaded - show domain rows
          domains.slice(0, 10).map((domain, index) => (
            <TableRow
              key={domain.name}
              domain={domain}
              index={index}
              displayedColumns={SIMILAR_NAMES_COLUMNS}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default SimilarNames

