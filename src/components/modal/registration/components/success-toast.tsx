'use client'

import { formatDuration } from '@/utils/time/formatDuration'
import { Cross } from 'ethereum-identity-kit'
import { useEffect, useState } from 'react'

export interface SuccessSummaryEntry {
  name: string
  durationSeconds: number
}

export interface SuccessSummary {
  entries: SuccessSummaryEntry[]
  priceETH: number
  priceUSD: number
}

interface SuccessToastProps {
  summary: SuccessSummary
  onClose: () => void
}

const SuccessToast: React.FC<SuccessToastProps> = ({ summary, onClose }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={`border-tertiary bg-background fixed right-6 bottom-6 z-50 flex max-w-[380px] min-w-[300px] flex-col overflow-hidden rounded-lg border-2 shadow-lg transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className='flex items-center gap-2.5 px-4 pt-3 pb-2'>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          width='20'
          height='20'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          className='text-primary shrink-0'
        >
          <polyline points='20 6 9 17 4 12' />
        </svg>
        <span className='text-md flex-1 font-semibold'>Registration Successful</span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className='text-neutral hover:text-foreground -mr-1 shrink-0 cursor-pointer p-1 transition-colors'
          aria-label='Close'
        >
          <Cross height={14} width={14} />
        </button>
      </div>

      <div className='max-h-[200px] overflow-y-auto px-4'>
        {summary.entries.map((entry) => (
          <div key={entry.name} className='text-text-secondary flex items-center justify-between gap-4 py-1 text-sm'>
            <span className='truncate font-medium'>{entry.name}</span>
            <span className='shrink-0'>{formatDuration(entry.durationSeconds)}</span>
          </div>
        ))}
      </div>

      <div className='border-tertiary text-text-secondary mx-4 mt-1 border-t pt-2 pb-3 text-sm'>
        {summary.priceETH.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')} ETH{' '}
        <span className='text-neutral'>(~${summary.priceUSD.toFixed(2)})</span>
      </div>
    </div>
  )
}

export default SuccessToast
