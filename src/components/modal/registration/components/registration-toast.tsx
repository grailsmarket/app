'use client'

import { useEffect, useState } from 'react'
import { RegistrationFlowState } from '@/types/registration'
import useDraggable from '../hooks/useDraggable'
import { cn } from '@/utils/tailwind'

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
  const { ref, position, isDragging, onPointerDown, onPointerMove, onPointerUp } = useDraggable(onClick)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const isWaiting = flowState === 'waiting'
  const isCommitting = flowState === 'committing'
  const isError = flowState === 'error'
  const waitReady = isWaiting && waitTimeRemaining === 0
  const pendingWallet = (isCommitting || flowState === 'registering') && !hasTxHash

  const label = isError
    ? 'Registration Error'
    : pendingWallet
      ? 'Confirm in Wallet'
      : isCommitting
        ? 'Submitting Commitment...'
        : waitReady
          ? 'Ready to Register'
          : isWaiting
            ? 'Waiting Period'
            : 'Completing Registration...'

  const subtitle = isError
    ? 'Click to view details'
    : pendingWallet
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
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={position ? { left: position.x, top: position.y } : undefined}
      className={cn(
        'fixed z-50 flex min-w-[260px] touch-none flex-col overflow-hidden rounded-lg border-2 shadow-lg select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab hover:scale-[1.02]',
        isDragging ? '' : 'transition-all duration-300',
        isError
          ? 'border-red-500 bg-[#450a0b]'
          : waitReady
            ? 'bg-primary text-background border-primary'
            : 'border-tertiary bg-background',
        position ? '' : 'right-6 bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      {isWaiting && (
        <div className='bg-tertiary h-1.5 w-full'>
          <div
            className='bg-primary h-full transition-all duration-1000 ease-linear'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
      <div className={cn('flex items-center gap-3 px-4 py-3', !position && 'pb-1')}>
        {isError ? (
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='shrink-0 text-red-500'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='15' y1='9' x2='9' y2='15' />
            <line x1='9' y1='9' x2='15' y2='15' />
          </svg>
        ) : isWaiting ? null : (
          <div className='border-primary h-5 w-5 animate-spin rounded-full border-2 border-b-transparent' />
        )}
        <div className='flex flex-col'>
          <span className='text-md font-semibold'>{label}</span>
          {subtitle && (
            <span
              className={`text-sm ${isError ? 'text-red-400' : waitReady ? 'text-background/70' : 'text-text-secondary'}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
      {!position && (
        <p className={`pb-1.5 text-center text-[10px] ${waitReady ? 'text-background/40' : 'text-neutral'}`}>
          (drag to move around)
        </p>
      )}
    </div>
  )
}

export default RegistrationToast
