'use client'

import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import { TransferDomainType } from '@/state/reducers/modals/transferModal'
import { formatAddress } from '@/utils/formatAddress'
import { beautifyName } from '@/lib/ens'
import { useTransferModal } from './hooks/use-transfer-modal'
import TransferReviewForm from './components/review-form'
import TransferSubject from './components/transfer-subject'
import TransferProgressView from './components/progress-view'
import TransferSuccessView from './components/success-view'
import TransferErrorView from './components/error-view'
import {
  estimateTransferBatches,
  getTransferBatchNames,
  getTransferProgressStatus,
  getTransferSteps,
  type TransferProgressInput,
} from './components/transfer-steps'

const KEEP_OPEN_HINT = 'Keep this window open until the transaction confirms.'

type TransferModalState = ReturnType<typeof useTransferModal>

export type TransferModalViewState = Pick<
  TransferModalState,
  | 'step'
  | 'error'
  | 'errorDetails'
  | 'account'
  | 'recipient'
  | 'recipientInput'
  | 'setRecipientInput'
  | 'recipientError'
  | 'isResolving'
  | 'isBusy'
  | 'recipientLocked'
  | 'walletMismatch'
  | 'canTransfer'
  | 'transaction'
  | 'completedTransactions'
  | 'completedNames'
  | 'remainingDomains'
  | 'approvingContract'
  | 'currentNetwork'
  | 'hasPendingTransaction'
  | 'processingKind'
  | 'approvals'
  | 'activeBatch'
  | 'batchTotals'
  | 'handleTransfer'
  | 'handleClose'
  | 'handleRetry'
>

interface TransferModalViewProps {
  domains: TransferDomainType[]
  modal: TransferModalViewState
}

// Every state of the transfer in one shell: review, the busy screens, success and error.
export const TransferModalView: React.FC<TransferModalViewProps> = ({ domains, modal }) => {
  const {
    step,
    error,
    errorDetails,
    account,
    recipient,
    recipientError,
    isResolving,
    isBusy,
    canTransfer,
    transaction,
    completedTransactions,
    completedNames,
    remainingDomains,
    hasPendingTransaction,
    batchTotals,
    handleTransfer,
    handleClose,
    handleRetry,
  } = modal
  const isSingle = domains.length === 1
  const isUnconfirmed = step === 'error' && hasPendingTransaction

  // While the recipient is being typed, the subject names it only once it resolves to a valid address.
  const recipientLabel =
    recipient && (step !== 'review' || (!recipientError && !isResolving))
      ? account?.ens?.name || formatAddress(recipient)
      : null
  const transactionCount = batchTotals ? batchTotals[1] + batchTotals[2] : estimateTransferBatches(domains)

  const progressInput: TransferProgressInput = {
    step,
    isSingle,
    domains,
    completedNames,
    completedTransactions,
    transaction,
    hasPendingTransaction,
    processingKind: modal.processingKind,
    approvals: modal.approvals,
    approvingContract: modal.approvingContract,
    activeBatch: modal.activeBatch,
    batchTotals,
    network: modal.currentNetwork,
  }
  const progressStatus = isBusy ? getTransferProgressStatus(progressInput) : null

  const renderStage = () => {
    if (step === 'review') {
      return (
        <TransferReviewForm
          domains={domains}
          completedNames={completedNames}
          recipientInput={modal.recipientInput}
          setRecipientInput={modal.setRecipientInput}
          account={account}
          isResolving={isResolving}
          recipientError={recipientError}
          recipientLocked={modal.recipientLocked}
          walletMismatch={modal.walletMismatch}
        />
      )
    }

    if (progressStatus) {
      return (
        <TransferProgressView
          status={progressStatus}
          batchNames={getTransferBatchNames(progressInput)}
          steps={getTransferSteps(progressInput)}
        />
      )
    }

    if (step === 'success') {
      const recipientName = recipientLabel ?? ''

      return (
        <TransferSuccessView
          message={
            isSingle
              ? `${beautifyName(domains[0].name)} transferred to ${recipientName}.`
              : `${completedNames.size} names transferred to ${recipientName}.`
          }
          transactions={completedTransactions}
        />
      )
    }

    return (
      <TransferErrorView
        unconfirmed={isUnconfirmed}
        error={error}
        errorDetails={errorDetails}
        pendingTransaction={transaction}
        partial={
          completedNames.size > 0
            ? { transferred: completedNames.size, total: domains.length, transactions: completedTransactions }
            : null
        }
      />
    )
  }

  const renderFooter = () => {
    if (step === 'review') {
      return (
        <>
          <PrimaryButton onClick={handleTransfer} disabled={!canTransfer} className={modalPrimaryActionClassName}>
            {completedNames.size
              ? `Transfer ${remainingDomains.length} remaining name${remainingDomains.length === 1 ? '' : 's'}`
              : 'Transfer'}
          </PrimaryButton>
          <SecondaryButton onClick={handleClose} className={modalActionClassName}>
            Cancel
          </SecondaryButton>
        </>
      )
    }

    if (isBusy) return null

    if (step === 'success') {
      return (
        <SecondaryButton onClick={handleClose} className={modalActionClassName}>
          Close
        </SecondaryButton>
      )
    }

    return (
      <>
        <PrimaryButton onClick={isUnconfirmed ? handleTransfer : handleRetry} className={modalPrimaryActionClassName}>
          {isUnconfirmed ? 'Check Transaction' : 'Try Again'}
        </PrimaryButton>
        <SecondaryButton onClick={handleClose} className={modalActionClassName}>
          Close
        </SecondaryButton>
      </>
    )
  }

  // The review form lists the names itself. Several names end on the success orb alone; one name keeps its
  // subject, now with its new owner.
  const showSubject = step !== 'review' && !(step === 'success' && !isSingle)

  return (
    <ModalShell
      title={`Transfer Name${domains.length > 1 ? 's' : ''}`}
      onClose={handleClose}
      locked={isBusy}
      dismissible={step === 'review' || step === 'error'}
      stageKey={isBusy ? 'progress' : isUnconfirmed ? 'unconfirmed' : step}
      subject={
        showSubject ? (
          <TransferSubject
            domains={domains}
            recipientLabel={recipientLabel}
            transactionCount={transactionCount}
            compact={isBusy || step === 'error'}
            transferred={step === 'success'}
          />
        ) : null
      }
      footer={renderFooter()}
      footerHint={progressStatus && progressStatus.state !== 'wallet' ? KEEP_OPEN_HINT : undefined}
    >
      {renderStage()}
    </ModalShell>
  )
}

interface TransferModalProps {
  domains: TransferDomainType[]
  onClose: () => void
}

const TransferModal: React.FC<TransferModalProps> = ({ domains, onClose }) => {
  const modal = useTransferModal(domains, onClose)
  return <TransferModalView domains={domains} modal={modal} />
}

export default TransferModal
