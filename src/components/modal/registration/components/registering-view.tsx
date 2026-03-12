import SecondaryButton from '@/components/ui/buttons/secondary'
import { beautifyName } from '@/lib/ens'
import type { BatchState, NameRegistrationEntry } from '@/types/registration'
import CollapsibleNameList from './collapsible-name-list'

interface RegisteringViewProps {
  totalBatches: number
  currentBatchIndex: number
  currentBatch: BatchState | undefined
  availableEntries: NameRegistrationEntry[]
  isBulk: boolean
  onCancel: () => void
}

const RegisteringView: React.FC<RegisteringViewProps> = ({
  totalBatches,
  currentBatchIndex,
  currentBatch,
  availableEntries,
  isBulk,
  onCancel,
}) => {
  const nameCount = currentBatch?.nameIndices.length ?? availableEntries.length
  const names = (currentBatch?.nameIndices.map((i) => availableEntries[i]?.name) ?? availableEntries.map((e) => e.name))
    .filter(Boolean)
    .map((n) => beautifyName(n))

  return (
    <div className='flex w-full flex-col gap-4'>
      <h2 className='mt-4 text-center text-xl font-bold'>Completing Registration</h2>
      {totalBatches > 1 && (
        <p className='text-neutral text-center text-lg'>
          Transaction {currentBatchIndex + 1} of {totalBatches}
        </p>
      )}
      {isBulk ? (
        <div className='flex items-center justify-center gap-1.5 text-lg'>
          <p>Registering</p>
          <CollapsibleNameList names={names} />
          <p>...</p>
        </div>
      ) : (
        <p className='text-center text-lg'>
          Registering {nameCount} name{nameCount > 1 ? 's' : ''}...
        </p>
      )}
      <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
        <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
        {currentBatch?.registerTxHash ? (
          <a
            href={`https://etherscan.io/tx/${currentBatch.registerTxHash}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 text-lg underline transition-colors'
          >
            View on Etherscan
          </a>
        ) : (
          <p className='text-neutral text-lg'>Please confirm the registration transaction</p>
        )}
      </div>
      <SecondaryButton onClick={onCancel} className='w-full'>
        Cancel
      </SecondaryButton>
    </div>
  )
}

export default RegisteringView
