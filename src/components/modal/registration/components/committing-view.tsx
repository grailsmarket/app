import SecondaryButton from '@/components/ui/buttons/secondary'
import type { BatchState, NameRegistrationEntry } from '@/types/registration'

interface CommittingViewProps {
  totalBatches: number
  currentBatchIndex: number
  currentBatch: BatchState | undefined
  availableEntries: NameRegistrationEntry[]
  onCancel: () => void
}

const CommittingView: React.FC<CommittingViewProps> = ({
  totalBatches,
  currentBatchIndex,
  currentBatch,
  availableEntries,
  onCancel,
}) => {
  const nameCount = currentBatch?.nameIndices.length ?? availableEntries.length

  return (
    <div className='flex w-full flex-col gap-4'>
      <h2 className='mt-4 text-center text-xl font-bold'>Submitting Commitment{totalBatches > 1 ? 's' : ''}</h2>
      {totalBatches > 1 && (
        <p className='text-neutral text-center text-lg'>
          Transaction {currentBatchIndex + 1} of {totalBatches}
        </p>
      )}
      <p className='text-center text-lg'>
        Committing {nameCount} name{nameCount > 1 ? 's' : ''}...
      </p>
      <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
        <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
        {currentBatch?.commitTxHash ? (
          <a
            href={`https://etherscan.io/tx/${currentBatch.commitTxHash}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 text-lg underline transition-colors'
          >
            View on Etherscan
          </a>
        ) : (
          <p className='text-neutral text-lg'>Please confirm the transaction in your wallet</p>
        )}
      </div>
      <SecondaryButton onClick={onCancel} className='w-full'>
        Cancel
      </SecondaryButton>
    </div>
  )
}

export default CommittingView
