'use client'

import { useEffect, useState } from 'react'
import { RegistrationFlowState } from '@/types/registration'

interface RegistrationToastProps {
  flowState: RegistrationFlowState
  waitTimeRemaining: number
  currentBatchIndex: number
  totalBatches: number
  hasTxHash: boolean
  onClick: () => void
}

const RegistrationToast: React.FC<RegistrationToastProps> = ({
  flowState,
  waitTimeRemaining,
  currentBatchIndex,
  totalBatches,
  hasTxHash,
  onClick,
}) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const isWaiting = flowState === 'waiting'
  const isCommitting = flowState === 'committing'
  const waitReady = isWaiting && waitTimeRemaining === 0
  const pendingWallet = (isCommitting || flowState === 'registering') && !hasTxHash

  const label = pendingWallet
    ? 'Confirm in Wallet'
    : isCommitting
      ? 'Submitting Commitment...'
      : waitReady
        ? 'Ready to Register'
        : isWaiting
          ? 'Waiting Period'
          : 'Completing Registration...'

  const subtitle = pendingWallet
    ? isCommitting
      ? 'Commitment transaction'
      : 'Registration transaction'
    : waitReady
      ? 'Click to continue'
      : isWaiting
        ? `${waitTimeRemaining}s remaining`
        : totalBatches > 1
          ? `Batch ${currentBatchIndex + 1} of ${totalBatches}`
          : undefined

  const WAIT_TOTAL = 60
  const progressPercent = isWaiting ? Math.min(100, ((WAIT_TOTAL - waitTimeRemaining) / WAIT_TOTAL) * 100) : 0

  return (
    <div
      onClick={onClick}
      className={`border-tertiary bg-background fixed right-6 bottom-6 z-50 flex min-w-[260px] cursor-pointer flex-col overflow-hidden rounded-lg border-2 shadow-lg transition-all duration-300 hover:scale-[1.02] ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {isWaiting && (
        <div className='bg-tertiary h-1.5 w-full'>
          <div
            className='bg-primary h-full transition-all duration-1000 ease-linear'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      <div className='flex items-center gap-3 px-4 py-3'>
        {isWaiting ? null : (
          <div className='border-primary h-5 w-5 animate-spin rounded-full border-2 border-b-transparent' />
        )}
        <div className='flex flex-col'>
          <span className='text-md font-semibold'>{label}</span>
          {subtitle && <span className='text-text-secondary text-sm'>{subtitle}</span>}
        </div>
      </div>
    </div>
  )
}

export default RegistrationToast
