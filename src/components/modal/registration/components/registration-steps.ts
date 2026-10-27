import type { TxStep } from '@/components/ui/modal/txSteps'
import type { BatchState, RegistrationFlowState } from '@/types/registration'

interface RegistrationStepsInput {
  flowState: RegistrationFlowState
  batches: BatchState[]
  currentBatchIndex: number
  isBulk: boolean
  nameCount: number
  tokenLabel: string
  isApproving: boolean
  approvalTxHash: string | null
  waitTimeRemaining: number
}

// Every transaction of a registration in flight (committing, waiting, registering), batch by batch:
// commit, wait, approve (only when the allowance was too low), register.
export const getRegistrationSteps = ({
  flowState,
  batches,
  currentBatchIndex,
  isBulk,
  nameCount,
  tokenLabel,
  isApproving,
  approvalTxHash,
  waitTimeRemaining,
}: RegistrationStepsInput): TxStep[] => {
  const totalBatches = batches.length
  const hasManyBatches = totalBatches > 1
  const currentBatch = batches[currentBatchIndex]
  const namesBefore = (index: number) =>
    batches.slice(0, index).reduce((count, batch) => count + batch.nameIndices.length, 0)
  const batchCounter = `${currentBatchIndex + 1} / ${totalBatches}`

  const commitStatus: TxStep['status'] = flowState === 'committing' ? 'active' : 'done'
  const waitStatus: TxStep['status'] =
    flowState === 'committing' ? 'upcoming' : flowState === 'waiting' && waitTimeRemaining > 0 ? 'active' : 'done'
  const registerStatus: TxStep['status'] = flowState === 'registering' && !isApproving ? 'active' : 'upcoming'

  const batchLinks = (kind: 'commit' | 'register') =>
    batches.flatMap((batch) => {
      const hash = kind === 'commit' ? batch.commitTxHash : batch.registerTxHash
      if (!hash) return []
      return [
        {
          key: `${kind}-${batch.batchIndex}`,
          hash,
          label: hasManyBatches ? `Batch ${batch.batchIndex + 1}` : kind === 'commit' ? 'Commit' : 'Register',
        },
      ]
    })

  const steps: TxStep[] = [
    {
      key: 'commit',
      label: hasManyBatches ? 'Submit Commitments' : 'Submit Commitment',
      status: commitStatus,
      detail:
        commitStatus === 'active'
          ? currentBatch?.commitTxHash
            ? isBulk
              ? `${namesBefore(currentBatchIndex)} of ${nameCount} names committed`
              : 'Committing 1 name...'
            : 'Waiting for your signature'
          : undefined,
      batch: commitStatus === 'active' && hasManyBatches ? batchCounter : undefined,
      links: batchLinks('commit'),
    },
    {
      key: 'wait',
      label: 'Wait 60 Seconds',
      status: waitStatus,
      detail: waitStatus === 'active' ? `${waitTimeRemaining} seconds left` : undefined,
    },
  ]

  if (isApproving || approvalTxHash) {
    steps.push({
      key: 'approve',
      label: `Approve ${tokenLabel} Spending`,
      status: isApproving ? 'active' : 'done',
      detail: isApproving
        ? approvalTxHash
          ? 'Waiting for the approval to confirm'
          : 'Waiting for your signature'
        : undefined,
      hash: approvalTxHash,
    })
  }

  steps.push({
    key: 'register',
    label: hasManyBatches ? 'Complete Registrations' : 'Complete Registration',
    status: registerStatus,
    detail:
      registerStatus === 'active'
        ? currentBatch?.registerTxHash
          ? isBulk
            ? `${namesBefore(currentBatchIndex)} of ${nameCount} names registered`
            : 'Registering 1 name...'
          : 'Waiting for your signature'
        : undefined,
    batch: registerStatus === 'active' && hasManyBatches ? batchCounter : undefined,
    links: batchLinks('register'),
  })

  return steps
}
