'use client'

import { confirmLeavingRecords } from '@/hooks/ens-v2/useDraftGuard'
import { useAccount } from 'wagmi'
import MigrationName from './migrationName'
import { buttonClass, Notice } from '@/components/ens-v2/ui'

export default function MigrationModal({ names, onClose }: { names: string[]; onClose: () => void }) {
  const { address } = useAccount()
  return (
    <div className='fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:items-center md:p-4'>
      <div
        role='dialog'
        aria-modal='true'
        aria-label='ENSv2 migration assistant'
        className='border-tertiary bg-background flex max-h-[90dvh] w-full max-w-3xl flex-col gap-5 overflow-y-auto rounded-t-xl border p-5 md:rounded-xl'
      >
        <div className='flex items-center justify-between gap-3'>
          <h2 className='text-2xl font-semibold'>ENSv2 migration assistant</h2>
          <button
            className={buttonClass}
            onClick={() => {
              if (confirmLeavingRecords()) onClose()
            }}
          >
            Close
          </button>
        </div>
        <Notice>
          Choose and prepare records for each name before migration. Confirmed steps are retained so an interrupted
          migration can continue.
        </Notice>
        {names.map((name) => (
          <MigrationName key={`${address}:${name}`} name={name} />
        ))}
      </div>
    </div>
  )
}
