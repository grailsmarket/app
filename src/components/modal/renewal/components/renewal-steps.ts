import type { TxStep } from '@/components/ui/modal/txSteps'
import type { RenewalStage } from '@/types/renewal'
import { Hex } from 'viem'

interface RenewalStepsInput {
  stage: RenewalStage
  batches: { version: 1 | 2 }[]
  currentBatch: number
  hashes: (string | undefined)[]
  approvals: { version: 1 | 2; hash: Hex }[]
  tokenLabel: string
  href: (hash: string, version: 1 | 2) => string
}

export const getRenewalSteps = ({
  stage,
  batches,
  currentBatch,
  hashes,
  approvals,
  tokenLabel,
  href,
}: RenewalStepsInput): TxStep[] => {
  const current = currentBatch - 1
  const currentVersion = batches[current]?.version ?? 2
  const isApproving = stage === 'approving'
  const isV1Approving = isApproving && currentVersion === 1
  const v1Approval = approvals.find((approval) => approval.version === 1)
  const isV2Approving = isApproving && currentVersion === 2
  const v2Approval = approvals.find((approval) => approval.version === 2)
  const hasApproval = approvals.length > 0

  if (batches.length <= 1) {
    const steps: TxStep[] = []
    const approval = approvals[approvals.length - 1]
    const hash = hashes[0]

    if (hasApproval) {
      steps.push({
        key: 'approve',
        label: `Approve ${tokenLabel}`,
        status: isApproving ? 'active' : 'done',
        hash: approval.hash,
        href: approval ? href(approval.hash, currentVersion) : undefined,
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
      links: indices.flatMap((index) => {
        const hash = hashes[index]
        return hash ? [{ key: `v${version}-${index}`, hash, href: href(hash, version) }] : []
      }),
    }
  }

  const approvalV1Row: TxStep | null =
    isV1Approving || v1Approval
      ? {
          key: 'approve',
          label: `Approve ${tokenLabel} • V1`,
          status: isV1Approving ? 'active' : 'done',
          hash: v1Approval?.hash,
          href: v1Approval && href(v1Approval?.hash, 1),
        }
      : null

  const approvalV2Row: TxStep | null =
    isV2Approving || v2Approval
      ? {
          key: 'approve',
          label: `Approve ${tokenLabel} • V2`,
          status: isV2Approving ? 'active' : v2Approval ? 'done' : 'upcoming',
          hash: v2Approval?.hash,
          href: v2Approval && href(v2Approval?.hash, 1),
        }
      : null

  return [approvalV1Row, versionRow(1), approvalV2Row, versionRow(2)].filter((step): step is TxStep => !!step)
}
