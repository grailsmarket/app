import type { TxStep } from '@/components/ui/modal/txSteps'
import type { RenewalPayment, RenewalStage } from '@/types/renewal'

interface RenewalStepsInput {
  stage: RenewalStage
  /** The run's batches in order: V1 first, then V2. */
  batches: { version: 1 | 2; payment: RenewalPayment }[]
  /** 1-based index of the batch in flight. */
  currentBatch: number
  /** Each batch's hash once it was sent, by batch index. */
  hashes: (string | undefined)[]
  /** Token approvals sent during this run. */
  approvalHashes: string[]
  tokenLabel: string
  href: (hash: string, version: 1 | 2) => string
}

// The steps of a renewal in flight. One transaction: Approve (when it happens), Confirm Renewal, Onchain
// Confirmation. Several: a row per name version with a batch counter and one hash pill per sent batch,
// and the token approval between them. The approval row shows up once the allowance turns out too low.
export const getRenewalSteps = ({
  stage,
  batches,
  currentBatch,
  hashes,
  approvalHashes,
  tokenLabel,
  href,
}: RenewalStepsInput): TxStep[] => {
  const current = currentBatch - 1
  const currentVersion = batches[current]?.version ?? 2
  const isApproving = stage === 'approving'
  const hasApproval = isApproving || approvalHashes.length > 0
  const approvalLinks = approvalHashes.map((hash, index) => ({
    key: `approve-${index}`,
    hash,
    href: href(hash, 2),
  }))

  if (batches.length <= 1) {
    const steps: TxStep[] = []
    const approvalHash = approvalHashes[approvalHashes.length - 1]
    const hash = hashes[0]

    if (hasApproval) {
      steps.push({
        key: 'approve',
        label: `Approve ${tokenLabel}`,
        status: isApproving ? 'active' : 'done',
        hash: approvalHash,
        href: approvalHash ? href(approvalHash, 2) : undefined,
      })
    }

    steps.push(
      {
        key: 'confirm',
        label: 'Confirm Renewal',
        status: isApproving ? 'upcoming' : stage === 'confirming' ? 'active' : 'done',
      },
      {
        key: 'onchain',
        label: 'Onchain Confirmation',
        status: stage === 'processing' ? 'active' : 'upcoming',
        hash: stage === 'processing' ? hash : null,
        href: stage === 'processing' && hash ? href(hash, currentVersion) : undefined,
      }
    )

    return steps
  }

  const versionRow = (version: 1 | 2): TxStep | null => {
    const indices = batches.flatMap((batch, index) => (batch.version === version ? [index] : []))
    if (!indices.length) return null

    const first = indices[0]
    const last = indices[indices.length - 1]
    const isCurrent = currentVersion === version && current >= first && current <= last

    return {
      key: `v${version}`,
      label: `Extend V${version} Names`,
      status: current > last ? 'done' : isCurrent && !isApproving ? 'active' : 'upcoming',
      batch: isCurrent && indices.length > 1 ? `${current - first + 1} / ${indices.length}` : undefined,
      links: indices.flatMap((index) => {
        const hash = hashes[index]
        return hash ? [{ key: `v${version}-${index}`, hash, href: href(hash, version) }] : []
      }),
    }
  }

  const approvalRow: TxStep | null = hasApproval
    ? {
        key: 'approve',
        label: `Approve ${tokenLabel}`,
        status: isApproving ? 'active' : 'done',
        // One approval is a single pill at the end of the row; several get one pill each.
        hash: approvalLinks.length === 1 ? approvalLinks[0].hash : undefined,
        href: approvalLinks.length === 1 ? approvalLinks[0].href : undefined,
        links: approvalLinks.length > 1 ? approvalLinks : undefined,
      }
    : null

  // The approval comes before the first batch paid in the token: V2 names, or V1 names too once they
  // renew through ETHRenewerV1.
  const rows =
    batches[0]?.payment === 'token'
      ? [approvalRow, versionRow(1), versionRow(2)]
      : [versionRow(1), approvalRow, versionRow(2)]
  return rows.filter((step): step is TxStep => !!step)
}
