'use client'

import React from 'react'
import { useSimilarNames } from '../hooks/useSimilarNames'
import { useAppSelector } from '@/state/hooks'
import { selectViewType } from '@/state/reducers/view'
import Card from '@/components/domains/grid/components/card'
import LoadingCard from '@/components/domains/grid/components/loadingCard'
import TableRow from '@/components/domains/table/components/TableRow'
import TableLoadingRow from '@/components/domains/table/components/TableLoadingRow'
import { MarketplaceHeaderColumn } from '@/types/domains'
import { cn } from '@/utils/tailwind'

interface Props {
  name: string
}

// Columns to display in list view for similar names
const SIMILAR_NAMES_COLUMNS: MarketplaceHeaderColumn[] = ['domain', 'price', 'owner', 'actions']

const SimilarNames: React.FC<Props> = ({ name }) => {
  const { domains, isLoading, error } = useSimilarNames(name)
  const viewType = useAppSelector(selectViewType)

  // Don't render if there's an error or no results after loading
  if (error || (!isLoading && domains.length === 0)) {
    return null
  }

  return (
    <div className='bg-secondary sm:border-tertiary mt-1 flex w-full flex-col gap-4 pt-4 pb-2 sm:mt-4 sm:rounded-lg sm:border-2 sm:pt-6 sm:pb-4'>
      <h2 className='px-lg xl:px-xl font-sedan-sc text-3xl'>Similar Names</h2>

      {viewType === 'grid' ? (
        // Grid View - 4 cards in a row
        <div className='px-md sm:px-lg xl:px-xl grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-4'>
          {isLoading
            ? // Loading state - 4 loading cards
              Array.from({ length: 4 }).map((_, index) => <LoadingCard key={`loading-${index}`} />)
            : // Loaded - show domain cards
              domains.slice(0, 4).map((domain, index) => (
                <Card
                  key={domain.name}
                  domain={domain}
                  index={index}
                  className='w-full'
                  isFirstInRow={index === 0}
                />
              ))}
        </div>
      ) : (
        // List View - 4 table rows
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
            ? // Loading state - 4 loading rows
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className='px-md md:p-md lg:p-lg border-tertiary flex h-[60px] w-full flex-row items-center justify-between border-b'
                >
                  <TableLoadingRow displayedColumns={SIMILAR_NAMES_COLUMNS} />
                </div>
              ))
            : // Loaded - show domain rows
              domains.slice(0, 4).map((domain, index) => (
                <TableRow
                  key={domain.name}
                  domain={domain}
                  index={index}
                  displayedColumns={SIMILAR_NAMES_COLUMNS}
                />
              ))}
        </div>
      )}
    </div>
  )
}

export default SimilarNames

