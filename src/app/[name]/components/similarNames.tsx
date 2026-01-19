'use client'

import React from 'react'
import { useSimilarNames } from '../hooks/useSimilarNames'
import TableRow from '@/components/domains/table/components/TableRow'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'
import { MarketplaceHeaderColumn } from '@/types/domains'
import { cn } from '@/utils/tailwind'

interface Props {
  name: string
  categories?: string[]
}

// Columns to display in list view for similar names
const SIMILAR_NAMES_COLUMNS: MarketplaceHeaderColumn[] = ['domain', 'price', 'owner', 'actions']

const SimilarNames: React.FC<Props> = ({ name, categories }) => {
  const { domains, isLoading, error } = useSimilarNames(name, categories)

  // Don't render if there's an error or no results after loading
  if (error || (!isLoading && domains.length === 0)) {
    return null
  }

  return (
    <div className='bg-secondary sm:border-tertiary mt-1 flex w-full flex-col gap-4 pt-4 pb-2 sm:mt-4 sm:rounded-lg sm:border-2 sm:pt-6 sm:pb-4'>
      <div className='px-lg xl:px-xl flex items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Suggested Names</h2>
        <span className='text-neutral text-lg'>GrailsAI (beta)</span>
      </div>

      <div className='w-full'>
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

        {/* Table Rows */}
        {isLoading
          ? // Loading state - 5 loading rows
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`loading-${index}`}
                className='px-md md:p-md lg:p-lg border-tertiary flex h-[60px] w-full flex-row items-center justify-between border-b'
              >
                <TableLoadingRow displayedColumns={SIMILAR_NAMES_COLUMNS} />
              </div>
            ))
          : // Loaded - show domain rows
            domains.slice(0, 5).map((domain, index) => (
              <TableRow
                key={domain.name}
                domain={domain}
                index={index}
                displayedColumns={SIMILAR_NAMES_COLUMNS}
              />
            ))}
      </div>
    </div>
  )
}

export default SimilarNames

