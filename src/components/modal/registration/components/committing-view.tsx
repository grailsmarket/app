import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import NameChips from '@/components/ui/modal/nameChips'
import { beautifyName } from '@/lib/ens'
import type { BatchState, NameRegistrationEntry } from '@/types/registration'

interface CommittingViewProps {
  totalBatches: number
  currentBatchIndex: number
  currentBatch: BatchState | undefined
  availableEntries: NameRegistrationEntry[]
  isBulk: boolean
  steps: TxStep[]
}

const CommittingView: React.FC<CommittingViewProps> = ({
  totalBatches,
  currentBatchIndex,
  currentBatch,
  availableEntries,
  isBulk,
  steps,
}) => {
  const nameCount = currentBatch?.nameIndices.length ?? availableEntries.length
  const names = (currentBatch?.nameIndices.map((i) => availableEntries[i]?.name) ?? availableEntries.map((e) => e.name))
    .filter(Boolean)
    .map((n) => beautifyName(n))

  return (
    <>
      <TxStatus
        state={currentBatch?.commitTxHash ? 'pending' : 'wallet'}
        title={totalBatches > 1 ? 'Submitting Commitments' : 'Submitting Commitment'}
        message={
          currentBatch?.commitTxHash
            ? `Committing ${nameCount} name${nameCount > 1 ? 's' : ''}...`
            : totalBatches > 1
              ? `Transaction ${currentBatchIndex + 1} of ${totalBatches}. Please confirm it in your wallet.`
              : 'Please confirm the transaction in your wallet'
        }
      />
      {isBulk && <NameChips names={names} />}
      <TxSteps steps={steps} />
    </>
  )
}

export default CommittingView
