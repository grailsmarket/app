import React from 'react'
import { cn } from '@/utils/tailwind'

export interface DetailRow {
  key: string
  label: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: 'success' | 'danger' | 'muted'
}

interface DetailListProps {
  rows: DetailRow[]
  /** The bottom line, set under a primary rule: "You Pay", "You Receive", "Total". */
  total?: { label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode }
  className?: string
}

const TONE_CLASS_NAMES = {
  success: 'text-green-400',
  danger: 'text-red-400',
  muted: 'text-neutral font-normal',
}

const DetailList: React.FC<DetailListProps> = ({ rows, total, className }) => {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      <div className='bg-secondary rounded-lg px-3 py-1'>
        <dl className='divide-line-subtle divide-y'>
          {rows.map((row) => (
            <div key={row.key} className='flex items-baseline justify-between gap-4 py-2.5'>
              <dt className='text-neutral shrink-0 text-lg'>{row.label}</dt>
              <dd className='flex min-w-0 flex-col items-end gap-0.5 text-right text-lg font-semibold tabular-nums'>
                <span className={cn(row.tone && TONE_CLASS_NAMES[row.tone])}>{row.value}</span>
                {row.sub && <span className='text-neutral text-md font-normal'>{row.sub}</span>}
              </dd>
            </div>
          ))}
        </dl>
        {total && (
          <div className='border-primary mt-1 flex items-baseline justify-between gap-4 border-t pt-3 pb-2'>
            <p className='text-lg font-semibold'>{total.label}</p>
            <div className='flex flex-col items-end gap-0.5 text-right tabular-nums'>
              <span className='text-xl font-bold'>{total.value}</span>
              {total.sub && <span className='text-neutral text-md'>{total.sub}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default DetailList
