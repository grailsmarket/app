import type { TxStep } from '@/components/ui/modal/txSteps'
import type { TxState } from '@/components/ui/modal/statusOrb'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'
import type { TransferStep, TransferTransaction } from '@/types/transfer'
import { getTransferDomainKey, getTransferTransactionUrl } from '@/utils/transfer'
import type {
  TransferActiveBatch,
  TransferApproval,
  TransferBatchTotals,
  TransferProcessingKind,
} from '../hooks/use-transfer-modal'

const BATCH_SIZE = 100
const VERSIONS = [1, 2] as const

/**
 * How many transfer transactions the names need before any batch is prepared: V1 names share one
 * bulk transfer contract, V2 names batch per registry (one registry per parent name), up to 100 a batch.
 */
export const estimateTransferBatches = (domains: TransferDomainType[]) => {
  const groups = new Map<string, Set<string>>()

  for (const domain of domains) {
    const key = getTransferDomainKey(domain)
    const group = domain.version === 1 ? 'v1' : `v2:${key.split('.').slice(1).join('.')}`
    groups.set(group, (groups.get(group) ?? new Set()).add(key))
  }

  return [...groups.values()].reduce((count, keys) => count + Math.ceil(keys.size / BATCH_SIZE), 0)
}

interface TransferProgressInput {
  step: TransferStep
  /** One name: the steps are "Confirm Transfer" and "Onchain Confirmation". */
  isSingle: boolean
  domains: TransferDomainType[]
  completedNames: Set<string>
  completedTransactions: TransferTransaction[]
  /** The transaction being confirmed onchain, or the last one. */
  transaction: TransferTransaction | null
  hasPendingTransaction: boolean
  processingKind: TransferProcessingKind | null
  approvals: TransferApproval[]
  approvingContract: string
  activeBatch: TransferActiveBatch | null
  batchTotals: TransferBatchTotals | null
  network: string
}

const isApprovalStep = ({ step, processingKind }: TransferProgressInput) =>
  step === 'approving' || (step === 'processing' && processingKind === 'approval')

const isTransferStep = ({ step, processingKind }: TransferProgressInput) =>
  step === 'confirming' || (step === 'processing' && processingKind !== 'approval')

/** The version of the batch being signed or confirmed, while a transfer (not an approval) is in flight. */
const getActiveVersion = (input: TransferProgressInput) =>
  isTransferStep(input) ? (input.activeBatch?.version ?? input.transaction?.version ?? null) : null

/** The transfer transaction in flight, still waiting for its receipt. */
const getInFlightTransfer = (input: TransferProgressInput) =>
  input.step === 'processing' && input.processingKind !== 'approval' && input.hasPendingTransaction
    ? input.transaction
    : null

// Every transaction of this run while it is in flight: the operator approvals the V1 batches need,
// then one row per name version with its batch counter and a hash pill per finished batch.
export const getTransferSteps = (input: TransferProgressInput): TxStep[] => {
  const { step, isSingle, domains, completedNames, completedTransactions, approvals, batchTotals } = input
  const approvalActive = isApprovalStep(input)
  const inFlight = getInFlightTransfer(input)

  const steps: TxStep[] = approvals.map((approval, index) => ({
    key: `approve-${index}`,
    label: `Approve ${approval.contractName}`,
    status: approvalActive && index === approvals.length - 1 ? 'active' : 'done',
    hash: approval.hash,
    // Approvals are only sent for V1 batches.
    href: approval.hash ? getTransferTransactionUrl({ hash: approval.hash, version: 1 }) : undefined,
  }))

  if (isSingle) {
    const isConfirming = step === 'confirming'
    const isProcessing = step === 'processing' && input.processingKind !== 'approval'

    steps.push(
      {
        key: 'confirm',
        label: 'Confirm Transfer',
        status: isConfirming ? 'active' : isProcessing ? 'done' : 'upcoming',
      },
      {
        key: 'onchain',
        label: 'Onchain Confirmation',
        status: isProcessing ? 'active' : 'upcoming',
        hash: isProcessing ? input.transaction?.hash : null,
        href: isProcessing && input.transaction ? getTransferTransactionUrl(input.transaction) : undefined,
      }
    )
    return steps
  }

  const activeVersion = getActiveVersion(input)

  for (const version of VERSIONS) {
    const names = domains.filter((domain) => domain.version === version)
    if (!names.length) continue

    const finished = completedTransactions.filter((transaction) => transaction.version === version)
    const transactions = inFlight?.version === version ? [...finished, inFlight] : finished
    const isDone = names.every((domain) => completedNames.has(getTransferDomainKey(domain)))
    const isActive = !isDone && activeVersion === version
    const total = batchTotals?.[version] ?? 0

    steps.push({
      key: `transfer-v${version}`,
      label: `Transfer V${version} Names`,
      status: isDone ? 'done' : isActive ? 'active' : 'upcoming',
      batch: isActive && total > 1 ? `${Math.min(finished.length + 1, total)} / ${total}` : undefined,
      links: transactions.map((transaction) => ({
        key: transaction.hash,
        hash: transaction.hash,
        href: getTransferTransactionUrl(transaction),
      })),
    })
  }

  return steps
}

export interface TransferProgressStatus {
  state: TxState
  title: string
  message: string
}

// What is happening now, for the TxStatus above the steps.
export const getTransferProgressStatus = (input: TransferProgressInput): TransferProgressStatus => {
  const { step, isSingle, network, approvingContract, completedNames, completedTransactions, batchTotals } = input

  if (step === 'preparing') {
    return {
      state: 'checking',
      title: isSingle ? 'Checking Name' : 'Checking Names',
      message: 'Checking ownership and transfer permissions...',
    }
  }

  if (step === 'approving') {
    return {
      state: 'wallet',
      title: `Approve ${approvingContract}`,
      message: 'Please confirm the approval in your wallet',
    }
  }

  if (step === 'processing' && input.processingKind === 'approval') {
    return {
      state: 'pending',
      title: `Approving ${approvingContract}`,
      message: `${network} · Waiting for onchain confirmation...`,
    }
  }

  if (step === 'confirming') {
    const total = batchTotals ? batchTotals[1] + batchTotals[2] : 0

    return {
      state: 'wallet',
      title: 'Confirm Transfer',
      message:
        !isSingle && total > 1
          ? `Transaction ${Math.min(completedTransactions.length + 1, total)} of ${total} on ${network}. Please confirm it in your wallet.`
          : 'Please confirm the transaction in your wallet',
    }
  }

  return isSingle
    ? {
        state: 'pending',
        title: 'Transferring Name',
        message: `${network} · Waiting for onchain confirmation...`,
      }
    : {
        state: 'pending',
        title: 'Transferring Names',
        message: `${network} · Transferring ${completedNames.size}/${input.domains.length} names...`,
      }
}

/** The names of the batch being signed or confirmed, shown as chips under the status. */
export const getTransferBatchNames = (input: TransferProgressInput) =>
  !input.isSingle && isTransferStep(input) ? (input.activeBatch?.names ?? null) : null

export type { TransferProgressInput }
