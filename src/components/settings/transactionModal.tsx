'use client'

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import TxStatus from '@/components/ui/modal/txStatus'
import {
  KEEP_OPEN_HINT,
  TransactionFailure,
  TransactionLinks,
  TransactionProgress,
  TransactionUnconfirmed,
  confirmedTransactions,
  currentStepLabel,
  isTransactionBusy,
  isWalletPrompt,
  sentTransactionCount,
  type SettingsTransactionView,
} from './transactionScreens'

export interface SettingsTransactionModalProps extends SettingsTransactionView {
  /** Names the whole action and stays constant, e.g. "Set Primary Name". The step is the TxStatus title. */
  title: string
  networkName?: string
  /** Defaults to "Changes Saved". */
  successTitle?: string
  successMessage?: string
  /** Defaults to "Transaction Failed". */
  errorTitle?: string
  onRetry: () => void
  onClose: () => void
}

interface SettingsTransactionScreen {
  key: string
  content: React.ReactNode
  footer?: React.ReactNode
  footerHint?: React.ReactNode
}

/** The stage and footer for one phase of the queue. Pure, so the preview can render it from mock props. */
export const settingsTransactionScreen = (props: SettingsTransactionModalProps): SettingsTransactionScreen => {
  const { title, networkName, submitted, onRetry, onClose } = props

  if (isTransactionBusy(props))
    return {
      key: 'progress',
      content: <TransactionProgress view={props} title={title} networkName={networkName} />,
      footerHint: isWalletPrompt(props) ? undefined : KEEP_OPEN_HINT,
    }

  if (props.phase === 'success')
    return {
      key: 'success',
      content: (
        <TxStatus state='success' title={props.successTitle ?? 'Changes Saved'} message={props.successMessage}>
          <TransactionLinks links={confirmedTransactions(props)} />
        </TxStatus>
      ),
      footer: (
        <SecondaryButton className={modalActionClassName} onClick={onClose}>
          Close
        </SecondaryButton>
      ),
    }

  if (submitted)
    return {
      key: 'unconfirmed',
      content: <TransactionUnconfirmed view={props} />,
      footer: (
        <>
          <PrimaryButton className={modalPrimaryActionClassName} onClick={onRetry}>
            Check Transaction
          </PrimaryButton>
          <SecondaryButton className={modalActionClassName} disabled>
            Close
          </SecondaryButton>
        </>
      ),
    }

  const single = sentTransactionCount(props) <= 1

  return {
    key: 'error',
    content: (
      <TransactionFailure
        view={props}
        title={props.errorTitle ?? 'Transaction Failed'}
        message={
          single
            ? 'Review the details below and try again.'
            : `${currentStepLabel(props, title)} could not be completed.`
        }
      />
    ),
    footer: (
      <>
        <PrimaryButton className={modalPrimaryActionClassName} onClick={onRetry}>
          {single ? 'Try Again' : 'Retry Remaining Steps'}
        </PrimaryButton>
        <SecondaryButton className={modalActionClassName} onClick={onClose}>
          Back to Editing
        </SecondaryButton>
      </>
    ),
  }
}

// Portaled above the Settings page, which SettingsTransactionProvider makes inert meanwhile. The z-120 layer keeps it
// over the page's own dialogs (the navigation guard is z-110); it also takes focus and keeps Tab inside the modal.
const SettingsTransactionModal: React.FC<SettingsTransactionModalProps> = (props) => {
  const layer = useRef<HTMLDivElement>(null)
  const canClose = !isTransactionBusy(props) && !props.submitted
  const screen = settingsTransactionScreen(props)

  useEffect(() => {
    const previousFocus = document.activeElement
    const overflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'
    layer.current?.focus()

    return () => {
      document.body.style.overflow = overflow

      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [])

  useEffect(() => {
    if (document.activeElement === document.body) layer.current?.focus()
  }, [props.phase])

  return createPortal(
    <div
      ref={layer}
      tabIndex={-1}
      className='relative z-120 outline-none'
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return

        const elements = layer.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')
        const first = elements?.[0]
        const last = elements?.[elements.length - 1]

        if (!first || !last) {
          event.preventDefault()
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === layer.current)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === layer.current)) {
          event.preventDefault()
          first.focus()
        }
      }}
    >
      <ModalShell
        title={props.title}
        onClose={() => {
          if (canClose) props.onClose()
        }}
        locked={!canClose}
        stageKey={screen.key}
        footer={screen.footer}
        footerHint={screen.footerHint}
      >
        {screen.content}
      </ModalShell>
    </div>,
    document.body
  )
}

export default SettingsTransactionModal
