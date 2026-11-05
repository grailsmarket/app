'use client'

import { cn } from '@/utils/tailwind'
import { formatDuration } from '@/utils/time/formatDuration'
import { Check, Cross } from 'ethereum-identity-kit'
import { useEffect, useState } from 'react'
import type { Address } from 'viem'
import { TOKENS } from '@/constants/web3/tokens'
import { formatPaymentAmount, isEthPayment } from '@/lib/ethPayment'

export interface SuccessSummaryEntry {
  name: string
  durationSeconds: number
}

export interface SuccessSummary {
  entries: SuccessSummaryEntry[]
  priceETH: number
  priceUSD: number
  asset: Address
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
      className={cn(
        'border-tertiary bg-background shadow-modal fixed right-6 bottom-6 z-50 flex max-w-95 min-w-75 flex-col overflow-hidden rounded-xl border transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className='flex items-center gap-3 px-3 pt-3 pb-2'>
        <span className='bg-primary text-background shadow-bulk grid h-8 w-8 shrink-0 place-items-center rounded-full'>
          <Check className='h-3.5 w-3.5' />
        </span>
        <span className='flex-1 text-lg font-bold'>Registration Successful</span>
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

      <div className='max-h-50 overflow-y-auto px-4'>
        {summary.entries.map((entry) => (
          <div key={entry.name} className='text-md flex items-center justify-between gap-4 py-1'>
            <span className='truncate font-medium'>{entry.name}</span>
            <span className='text-neutral shrink-0'>{formatDuration(entry.durationSeconds)}</span>
          </div>
        ))}
      </div>

      <div className='border-line-subtle text-md mx-4 mt-1 border-t pt-2 pb-3 font-semibold'>
        {isEthPayment(summary.asset) ? (
          <>
            {formatPaymentAmount(summary.priceETH, summary.asset)} ETH{' '}
            <span className='text-neutral'>(~${summary.priceUSD.toFixed(2)})</span>
          </>
        ) : (
          `${summary.priceUSD.toFixed(2)} ${TOKENS[summary.asset]}`
        )}
      </div>
    </div>
  )
}

export default SuccessToast
