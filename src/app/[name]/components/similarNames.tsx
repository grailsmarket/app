'use client'

import React from 'react'
import TableRow from '@/components/domains/table/components/TableRow'
import LoadingCell from '@/components/ui/loadingCell'
import { MarketplaceHeaderColumn } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import { useSimilarNames } from '../hooks/useSimilarNames'

interface Props {
  name: string
}

const SIMILAR_NAMES_COLUMNS: MarketplaceHeaderColumn[] = ['domain', 'price', 'owner', 'actions']

const SimilarNames: React.FC<Props> = ({ name }) => {
  const { domains, isLoading, loadingPhase, status } = useSimilarNames(name)
  const [showAiThinkingLabel, setShowAiThinkingLabel] = React.useState(false)

  React.useEffect(() => {
    if (!(isLoading && loadingPhase === 'ai')) {
      setShowAiThinkingLabel(false)
      return
    }

    // Avoid flicker for quick cache hits; only show after a short delay.
    const timer = window.setTimeout(() => {
      setShowAiThinkingLabel(true)
    }, 600)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isLoading, loadingPhase])

  if (status === 'error' || status === 'empty') {
    return null
  }

  return (
    <div className='sm:border-tertiary bg-secondary pt-lg flex w-full flex-col gap-1 sm:rounded-lg sm:border-2 lg:gap-2'>
      <div className='px-lg xl:px-xl flex items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Recommended</h2>
        <span className='text-neutral text-lg'>✨ GrailsAI</span>
      </div>

      <div className='relative w-full'>
        <div className='border-tertiary px-md md:p-md lg:p-lg flex h-[40px] w-full flex-row items-center justify-between border-b'>
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

        {status === 'login_required' ? (
          <div className='text-neutral flex h-[180px] w-full items-center justify-center px-4 text-center text-base sm:text-lg'>
            Sign in to generate fresh AI recommendations for this name.
          </div>
        ) : isLoading ? (
          <div className='flex h-[300px] w-full animate-pulse flex-col items-center justify-center gap-3'>
            <LoadingCell height='20px' width='140px' radius='4px' />
            <span className='text-neutral text-lg'>
              {loadingPhase === 'ai' && showAiThinkingLabel ? 'AI Thinking...' : 'Loading name data...'}
            </span>
          </div>
        ) : (
          domains
            .slice(0, 10)
            .map((domain, index) => (
              <TableRow
                key={domain.name}
                domain={domain}
                index={index}
                displayedColumns={SIMILAR_NAMES_COLUMNS}
                hideCartIcon
              />
            ))
        )}
      </div>
    </div>
  )
}

export default SimilarNames
