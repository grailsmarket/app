'use client'

import React from 'react'
import PrimaryButton from '@/components/ui/buttons/primary'
import { formatAddress } from '@/utils/formatAddress'
import useMaliciousApprovals from '@/hooks/useMaliciousApprovals'

interface Props {
  approvalCheck: ReturnType<typeof useMaliciousApprovals>
}

// Shown in buy / offer flows while the connected wallet still approves an exploited operator.
const RevokeApprovalsNotice: React.FC<Props> = ({ approvalCheck }) => {
  const {
    approvals,
    hasMaliciousApprovals,
    isCheckComplete,
    checkFailed,
    retryCheck,
    revoke,
    isRevoking,
    revokeError,
  } = approvalCheck

  if (checkFailed) {
    return (
      <div className='flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
        <p className='text-md text-red-400'>
          We couldn&apos;t verify your wallet&apos;s ENS approvals, so this action is paused for your safety.
        </p>
        <PrimaryButton onClick={retryCheck} className='w-full'>
          Retry Check
        </PrimaryButton>
      </div>
    )
  }

  if (!isCheckComplete) {
    return <p className='text-md text-neutral text-center'>Checking wallet approvals…</p>
  }

  if (!hasMaliciousApprovals) return null

  return (
    <div className='flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
      <p className='text-md font-bold text-red-400'>Revoke unsafe approval first</p>
      <p className='text-md text-red-400'>
        Your wallet still lets a contract abused in the {approvals[0].incident} move your ENS names. Anything you buy
        could be taken again. Revoke the approval before continuing.
      </p>
      <ul className='text-md text-red-400'>
        {approvals.map((approval) => (
          <li key={`${approval.contract}-${approval.operator}`}>
            {approval.contractLabel} → {formatAddress(approval.operator)}
          </li>
        ))}
      </ul>
      {revokeError && <p className='text-md line-clamp-3 text-red-400'>{revokeError}</p>}
      <PrimaryButton onClick={revoke} disabled={isRevoking} className='w-full'>
        {isRevoking ? 'Revoking…' : approvals.length > 1 ? `Revoke ${approvals.length} Approvals` : 'Revoke Approval'}
      </PrimaryButton>
    </div>
  )
}

export default RevokeApprovalsNotice
