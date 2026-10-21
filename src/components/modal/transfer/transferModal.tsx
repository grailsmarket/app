'use client'

import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import Input from '@/components/ui/input'
import { TransferDomainType } from '@/state/reducers/modals/transferModal'
import { formatAddress } from '@/utils/formatAddress'
import { isAddress } from 'viem'
import { beautifyName } from '@/lib/ens'
import { Avatar, Check } from 'ethereum-identity-kit'
import { getTransferDomainKey, getTransferTransactionUrl } from '@/utils/transfer'
import { useTransferModal } from './hooks/use-transfer-modal'

interface TransferModalProps {
  domains: TransferDomainType[]
  onClose: () => void
}

const TransferModal: React.FC<TransferModalProps> = ({ domains, onClose }) => {
  const {
    step,
    error,
    account,
    recipient,
    recipientInput,
    setRecipientInput,
    recipientError,
    isResolving,
    isBusy,
    recipientLocked,
    walletMismatch,
    canTransfer,
    transaction,
    completedTransactions,
    completedNames,
    remainingDomains,
    approvingContract,
    currentNetwork,
    currentBatch,
    totalBatches,
    hasPendingTransaction,
    handleTransfer,
    handleClose,
    handleRetry,
  } = useTransferModal(domains, onClose)
  const hasV2 = domains.some((domain) => domain.version === 2)

  const renderTransactions = () => (
    <div className='flex flex-col items-center gap-1'>
      {completedTransactions.map((transaction, index) => (
        <a
          key={`${transaction.version}-${transaction.hash}`}
          href={getTransferTransactionUrl(transaction)}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary underline hover:opacity-80'
        >
          {completedTransactions.length > 1 ? `View transfer ${index + 1} on Etherscan` : 'View on Etherscan'}
        </a>
      ))}
    </div>
  )

  return (
    <div
      onClick={() => {
        if (step === 'review' || step === 'error') handleClose()
      }}
      className='fixed inset-0 z-50 flex h-dvh w-screen items-end justify-end bg-black/50 backdrop-blur-sm md:items-center md:justify-center md:p-4'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='border-tertiary bg-background relative flex max-h-[calc(100dvh-80px)] w-full flex-col gap-4 overflow-y-auto border-t p-4 transition-all duration-300 md:max-w-md md:rounded-md md:border-2 md:p-6 starting:translate-y-full md:starting:translate-y-0'
      >
        <h2 className='font-sedan-sc min-h-6 text-center text-3xl'>Transfer Name{domains.length > 1 ? 's' : ''}</h2>
        {step === 'review' ? (
          <>
            <div className='space-y-2'>
              <h3 className='px-lg text-lg font-semibold'>
                {domains.length > 1 ? `Names to Transfer (${domains.length})` : 'Name to Transfer'}
              </h3>
              <div className='bg-secondary max-h-48 overflow-y-auto rounded-md p-4'>
                {domains.map((domain) => (
                  <div
                    key={getTransferDomainKey(domain)}
                    className='relative flex w-full items-center justify-between gap-2 py-1 font-bold'
                  >
                    <span className='truncate'>{beautifyName(domain.name)}</span>
                    <span className='text-neutral text-xs'>V{domain.version}</span>
                    {completedNames.has(getTransferDomainKey(domain)) && (
                      <Check className='h-4 w-4 shrink-0 text-green-400' />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className='space-y-2'>
              <Input
                label='Recipient'
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder='Address or ENS name'
                disabled={recipientLocked}
              />
              {account?.address && !isResolving && (
                <div className='flex items-center gap-2'>
                  {account.ens?.avatar && (
                    <Avatar
                      address={account.address}
                      src={account.ens.avatar}
                      name={account.ens.name}
                      style={{ width: '24px', height: '24px' }}
                    />
                  )}
                  <p className='text-md text-neutral max-w-full truncate pt-0.5 font-medium'>
                    {isAddress(recipientInput.trim()) ? account.ens?.name || account.address : account.address}
                  </p>
                </div>
              )}
              {isResolving && <p className='text-neutral text-sm'>Resolving recipient...</p>}
              {recipientError && <p className='text-sm text-red-400'>{recipientError}</p>}
              {walletMismatch && (
                <p className='text-sm text-red-400'>Reconnect the wallet that started this transfer.</p>
              )}
              {recipientLocked && (
                <p className='text-neutral text-sm'>The recipient is fixed while completing the remaining transfers.</p>
              )}
            </div>
            {hasV2 && (
              <p className='text-neutral text-sm'>
                Resolver configurations and their permissions stay unchanged when a name transfers.
              </p>
            )}
            <div className='flex flex-col gap-2'>
              <PrimaryButton onClick={handleTransfer} disabled={!canTransfer} className='w-full'>
                {completedNames.size
                  ? `Transfer ${remainingDomains.length} remaining name${remainingDomains.length === 1 ? '' : 's'}`
                  : 'Transfer'}
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Cancel
              </SecondaryButton>
            </div>
          </>
        ) : isBusy ? (
          <>
            <p className='text-center font-bold'>
              {step === 'preparing'
                ? 'Checking names'
                : step === 'approving'
                  ? `Approve ${approvingContract}`
                  : step === 'confirming'
                    ? 'Confirm transfer'
                    : 'Confirming transaction'}
              {step !== 'preparing' && totalBatches > 1 ? ` (${currentBatch} of ${totalBatches})` : ''}
            </p>
            <div className='flex flex-col items-center gap-4 text-center'>
              <div className='border-primary my-2 inline-block h-12 w-12 animate-spin rounded-full border-b-2' />
              <p className='text-lg'>
                {step === 'preparing'
                  ? 'Checking ownership and transfer permissions...'
                  : step === 'approving' || step === 'confirming'
                    ? 'Please confirm the transaction in your wallet...'
                    : 'Waiting for onchain confirmation...'}
              </p>
              {step !== 'preparing' && <p className='text-neutral text-sm'>{currentNetwork}</p>}
              <p className='text-neutral text-sm'>
                {completedNames.size} of {domains.length} names transferred
              </p>
              {transaction && (
                <a
                  href={getTransferTransactionUrl(transaction)}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary underline hover:opacity-80'
                >
                  View transaction on Etherscan
                </a>
              )}
              {renderTransactions()}
            </div>
            <SecondaryButton disabled className='w-full'>
              Close
            </SecondaryButton>
          </>
        ) : step === 'success' ? (
          <>
            <div className='flex flex-col items-center gap-4'>
              <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <p className='text-center text-lg font-medium'>
                {domains.length === 1 ? beautifyName(domains[0].name) : `${completedNames.size} names`} transferred to{' '}
                {account?.ens?.name || formatAddress(recipient ?? '')} successfully!
              </p>
              {renderTransactions()}
            </div>
            <SecondaryButton onClick={handleClose} className='w-full'>
              Close
            </SecondaryButton>
          </>
        ) : (
          <>
            <div className='flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='text-2xl font-bold text-red-400'>
                {hasPendingTransaction ? 'Confirmation unavailable' : 'Transfer failed'}
              </h2>
              <p className='wrap-break-word text-red-400'>{error}</p>
              {completedNames.size > 0 && (
                <p className='text-sm text-yellow-400'>
                  {completedNames.size} of {domains.length} names transferred. Retrying will only transfer the remaining
                  names.
                </p>
              )}
            </div>
            {hasPendingTransaction && transaction && (
              <a
                href={getTransferTransactionUrl(transaction)}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary text-center underline'
              >
                View pending transaction
              </a>
            )}
            {renderTransactions()}
            <div className='flex flex-col gap-2'>
              <PrimaryButton onClick={hasPendingTransaction ? handleTransfer : handleRetry} className='w-full'>
                {hasPendingTransaction ? 'Check transaction' : 'Try again'}
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TransferModal
