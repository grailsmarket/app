'use client'

import { useEffect, useState } from 'react'
import { RegistrationFlowState } from '@/types/registration'
import { Check } from 'ethereum-identity-kit'
import useDraggable from '../hooks/useDraggable'
import { BangIcon, EthIcon, WalletIcon } from '@/components/ui/modal/icons'
import { cn } from '@/utils/tailwind'

const RING_RADIUS = 14
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface RegistrationToastProps {
  flowState: RegistrationFlowState
  isApproving: boolean
  isDeployingResolver: boolean
  isResolverDeployed: boolean
  waitTimeRemaining: number
  currentBatchIndex: number
  totalBatches: number
  hasTxHash: boolean
  onClick: () => void
}

const RegistrationToast: React.FC<RegistrationToastProps> = ({
  flowState,
  isApproving,
  isDeployingResolver,
  isResolverDeployed,
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
  const resolverReady = flowState === 'resolver' && !isDeployingResolver && isResolverDeployed
  const isReady = (isWaiting && waitTimeRemaining === 0) || resolverReady
  const pendingWallet = (isCommitting || flowState === 'registering' || isDeployingResolver) && !hasTxHash

  const label =
    flowState === 'resolver'
      ? isDeployingResolver
        ? 'Deploying Resolver...'
        : resolverReady
          ? 'Resolver Deployed'
          : 'Set Up a Resolver'
      : isError
        ? 'Registration Error'
        : pendingWallet
          ? 'Confirm in Wallet'
          : isApproving
            ? 'Approving Token Spending...'
            : isCommitting
              ? 'Submitting Commitment...'
              : isReady
                ? 'Ready to Register'
                : isWaiting
                  ? 'Waiting Period'
                  : 'Completing Registration...'

  const subtitle =
    flowState === 'resolver'
      ? isDeployingResolver
        ? pendingWallet
          ? 'Confirm deployment in your wallet'
          : 'Waiting for confirmation'
        : resolverReady
          ? 'Click to continue'
          : 'Deploy a resolver or skip for now'
      : isError
        ? 'Click to view details'
        : pendingWallet
          ? isApproving
            ? 'Token spending approval'
            : isCommitting
              ? 'Commitment transaction'
              : 'Registration transaction'
          : isReady
            ? 'Click to continue'
            : isWaiting
              ? `${waitTimeRemaining}s remaining`
              : totalBatches > 1
                ? `Batch ${currentBatchIndex + 1} of ${totalBatches}`
                : undefined

  const WAIT_TOTAL = 60
  const waitLeft = Math.max(0, Math.min(WAIT_TOTAL, waitTimeRemaining))
  const isSpinning = !isError && !isWaiting
  const ringOffset = isWaiting ? RING_CIRCUMFERENCE * (waitLeft / WAIT_TOTAL) : 0

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={position ? { left: position.x, top: position.y } : undefined}
      className={cn(
        'shadow-modal fixed z-50 flex min-w-65 touch-none items-center gap-3 rounded-xl border py-2.5 pr-4 pl-2.5 select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab hover:-translate-y-0.5',
        isDragging ? '' : 'transition-all duration-300',
        isError
          ? 'bg-background border-red-500/30'
          : isReady
            ? 'bg-primary text-background border-primary shadow-bulk'
            : 'border-tertiary bg-background',
        position ? '' : 'right-6 bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <span
        aria-hidden='true'
        className={cn(
          'relative grid h-9 w-9 shrink-0 place-items-center rounded-full',
          isError ? 'bg-red-900/20 text-red-400' : isReady ? 'bg-background text-primary' : 'bg-secondary text-primary'
        )}
      >
        {!isReady && !isError && (
          <svg
            viewBox='0 0 32 32'
            className={cn(
              'absolute inset-0 h-full w-full -rotate-90',
              isSpinning && 'animate-spin [animation-duration:1.1s] motion-reduce:[animation-duration:2.4s]'
            )}
          >
            <circle cx='16' cy='16' r={RING_RADIUS} fill='none' strokeWidth='2.5' className='stroke-tertiary' />
            <circle
              cx='16'
              cy='16'
              r={RING_RADIUS}
              fill='none'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeDasharray={isSpinning ? `${RING_CIRCUMFERENCE * 0.28} ${RING_CIRCUMFERENCE}` : RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              className='stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear'
            />
          </svg>
        )}
        {isError ? (
          <BangIcon className='h-4 w-4' />
        ) : isReady ? (
          <Check className='h-3.5 w-3.5' />
        ) : isWaiting ? (
          <span className='text-foreground text-md relative font-bold tabular-nums'>{waitLeft}</span>
        ) : pendingWallet ? (
          <WalletIcon className='relative h-4 w-4' />
        ) : (
          <EthIcon className='relative h-4 w-4' />
        )}
      </span>
      <div className='flex flex-col'>
        <span className='text-lg font-bold'>{label}</span>
        {subtitle && (
          <span className={cn('text-md', isError ? 'text-red-400' : isReady ? 'text-background/75' : 'text-neutral')}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

export default RegistrationToast
