import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import NameChips from '@/components/ui/modal/nameChips'
import { beautifyName } from '@/lib/ens'
import type { BatchState, NameRegistrationEntry } from '@/types/registration'

interface RegisteringViewProps {
  isApproving: boolean
  approvalTxHash: string | null
  totalBatches: number
  currentBatchIndex: number
  currentBatch: BatchState | undefined
  availableEntries: NameRegistrationEntry[]
  isBulk: boolean
  steps: TxStep[]
}

const RegisteringView: React.FC<RegisteringViewProps> = ({
  isApproving,
  approvalTxHash,
  totalBatches,
  currentBatchIndex,
  currentBatch,
  availableEntries,
  isBulk,
  steps,
}) => {
  const txHash = isApproving ? approvalTxHash : currentBatch?.registerTxHash
  const nameCount = currentBatch?.nameIndices.length ?? availableEntries.length
  const names = (currentBatch?.nameIndices.map((i) => availableEntries[i]?.name) ?? availableEntries.map((e) => e.name))
    .filter(Boolean)
    .map((n) => beautifyName(n))

  return (
    <>
      <TxStatus
        state={txHash ? 'pending' : 'wallet'}
        title={isApproving ? 'Approving Token Spending' : 'Completing Registration'}
        message={
          isApproving
            ? 'Approve unlimited token spending to continue.'
            : txHash
              ? `Registering ${nameCount} name${nameCount > 1 ? 's' : ''}...`
              : totalBatches > 1
                ? `Transaction ${currentBatchIndex + 1} of ${totalBatches}. Please confirm the registration transaction.`
                : 'Please confirm the registration transaction'
        }
      />
      {isBulk && !isApproving && <NameChips names={names} />}
      <TxSteps steps={steps} />
    </>
  )
}

export default RegisteringView
