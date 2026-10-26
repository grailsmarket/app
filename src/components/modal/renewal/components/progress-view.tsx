import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import NameChips from '@/components/ui/modal/nameChips'
import type { TxState } from '@/components/ui/modal/statusOrb'
import { beautifyName } from '@/lib/ens'
import type { RenewalStage } from '@/types/renewal'
import { RenewalRunBatch } from '../hooks/use-renewal-modal'

interface ProgressStatusInput {
  stage: RenewalStage
  /** The token approval was sent and is waiting for its block. */
  isApprovalPending: boolean
  tokenLabel: string
  network: string
  currentBatch: number
  totalBatches: number
  namesProcessed: number
  totalNames: number
  runBatches: RenewalRunBatch[]
}

// approving: wallet, then pending once the approval is sent; confirming: wallet; processing: pending.
export const getProgressStatus = ({
  stage,
  isApprovalPending,
  tokenLabel,
  network,
  currentBatch,
  totalBatches,
  namesProcessed,
  totalNames,
  runBatches,
}: ProgressStatusInput): { state: TxState; title: string; message: string } => {
  const currBatchNames = runBatches[currentBatch - 1]?.names.length || 0
  const progress = `${network} · Extending ${namesProcessed + currBatchNames}/${totalNames} names...`

  if (stage === 'approving') {
    return isApprovalPending
      ? { state: 'pending', title: `Approve ${tokenLabel}`, message: progress }
      : { state: 'wallet', title: `Approve ${tokenLabel}`, message: 'Please confirm the approval in your wallet' }
  }

  if (stage === 'confirming') {
    return {
      state: 'wallet',
      title: 'Confirm Renewal',
      message:
        totalBatches > 1
          ? `Transaction ${currentBatch} of ${totalBatches} on ${network}. Please confirm it in your wallet.`
          : 'Please confirm the transaction in your wallet',
    }
  }

  return { state: 'pending', title: 'Confirming Renewal', message: progress }
}

interface ProgressViewProps extends ProgressStatusInput {
  /** The names of the batch in flight. */
  batchNames: string[]
  isBulk: boolean
  steps: TxStep[]
}

const ProgressView: React.FC<ProgressViewProps> = ({ batchNames, isBulk, steps, ...statusInput }) => {
  return (
    <>
      <TxStatus {...getProgressStatus(statusInput)} />
      {isBulk && statusInput.stage !== 'approving' && batchNames.length > 0 && (
        <NameChips key={`chips-${statusInput.currentBatch}`} names={batchNames.map((name) => beautifyName(name))} />
      )}
      <TxSteps steps={steps} />
    </>
  )
}

export default ProgressView
