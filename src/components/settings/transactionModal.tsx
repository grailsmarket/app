'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check } from 'ethereum-identity-kit'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'

export interface SettingsTransactionModalProps {
  phase: 'preparing' | 'confirming' | 'processing' | 'success' | 'error'
  title: string
  networkName?: string
  status?: string
  error?: string | null
  explorerUrl?: string | null
  progress?: { current: number; total: number }
  submitted: boolean
  onRetry: () => void
  onClose: () => void
}

const SettingsTransactionModal: React.FC<SettingsTransactionModalProps> = ({
  phase,
  title,
  status,
  error,
  explorerUrl,
  progress,
  submitted,
  onRetry,
  onClose,
}) => {
  const titleId = useId()
  const dialog = useRef<HTMLDivElement>(null)
  const busy = phase === 'preparing' || phase === 'confirming' || phase === 'processing'
  const canClose = !busy && !submitted

  useEffect(() => {
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    dialog.current?.focus()

    return () => {
      document.body.style.overflow = overflow

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])

  useEffect(() => {
    if (document.activeElement === document.body) dialog.current?.focus()
  }, [phase])

  return createPortal(
    <div
      className='fixed inset-0 z-120 flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm'
      onClick={(event) => {
        if (event.target === event.currentTarget && canClose) onClose()
      }}
    >
      <div
        ref={dialog}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        tabIndex={-1}
        className='bg-background border-tertiary flex max-h-[90dvh] w-full max-w-md flex-col gap-6 overflow-y-auto rounded-md border-2 p-6 outline-none'
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()

            if (canClose) onClose()
          }

          if (event.key !== 'Tab') return

          const elements = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')
          const first = elements?.[0]
          const last = elements?.[elements.length - 1]

          if (!first || !last) {
            event.preventDefault()
          } else if (
            event.shiftKey &&
            (document.activeElement === first || document.activeElement === dialog.current)
          ) {
            event.preventDefault()
            last.focus()
          } else if (
            !event.shiftKey &&
            (document.activeElement === last || document.activeElement === dialog.current)
          ) {
            event.preventDefault()
            first.focus()
          }
        }}
      >
        <h2 id={titleId} className='text-xl font-bold'>
          {title}
        </h2>
        <div className='flex flex-col items-center gap-4 text-center' aria-live='polite'>
          {busy && <div className='border-primary my-2 h-12 w-12 animate-spin rounded-full border-b-2' />}
          {phase === 'success' && (
            <div className='bg-primary flex w-fit items-center justify-center rounded-full p-2'>
              <Check className='text-background h-6 w-6' />
            </div>
          )}
          <p className='text-lg'>
            {phase === 'preparing'
              ? status || 'Preparing transaction…'
              : phase === 'confirming'
                ? 'Confirm in your wallet'
                : phase === 'processing'
                  ? 'Waiting for confirmation'
                  : phase === 'success'
                    ? 'Transaction complete'
                    : 'Transaction could not be completed'}
          </p>
          {busy && progress && progress.total > 1 && (
            <p className='text-neutral text-md'>
              Transaction {progress.current} of {progress.total}
            </p>
          )}
          {phase === 'error' && (
            <div role='alert' className='w-full rounded-lg border border-red-500/20 bg-red-900/20 p-4 text-left'>
              <p className='wrap-break-word text-red-400'>{error}</p>
              <p className='text-neutral mt-2 text-sm'>
                {submitted
                  ? 'This transaction has already been submitted. Check its status before continuing.'
                  : 'Confirmed transactions are saved. Your remaining changes are kept for retry.'}
              </p>
            </div>
          )}
          {explorerUrl && (
            <a className='text-primary text-lg underline' href={explorerUrl} target='_blank' rel='noreferrer'>
              View transaction
            </a>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          {phase === 'error' && (
            <PrimaryButton className='w-full' onClick={onRetry}>
              {submitted ? 'Check transaction' : 'Retry remaining steps'}
            </PrimaryButton>
          )}
          <SecondaryButton className='w-full' disabled={!canClose} onClick={onClose}>
            {phase === 'error' && !submitted ? 'Back to editing' : 'Close'}
          </SecondaryButton>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default SettingsTransactionModal
