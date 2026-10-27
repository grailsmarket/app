'use client'

import React from 'react'
import { useAccount } from 'wagmi'
import { CompromisedInfoType } from '@/types/domains'
import { isCompromisedCounterparty } from '@/utils/compromised'
import { formatAddress } from '@/utils/formatAddress'
import useMaliciousApprovals from '@/hooks/useMaliciousApprovals'
import RevokeApprovalsNotice from './revokeApprovalsNotice'

interface Props {
  compromised: CompromisedInfoType | null | undefined
}

const CompromisedBanner: React.FC<Props> = ({ compromised }) => {
  const { address } = useAccount()
  const approvalCheck = useMaliciousApprovals()

  if (!compromised) return null

  const isOriginalOwner = isCompromisedCounterparty(compromised, address)

  return (
    <div className='px-md w-full'>
      <div className='flex w-full flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
        <p className='text-lg font-bold text-red-400'>⚠️ This name was reported stolen</p>
        <p className='text-md text-red-400'>
          {compromised.incident.description ||
            `This name was taken from its owner in the ${compromised.incident.title}.`}{' '}
          Listings can only be bought, and offers only accepted, by the original owner (
          {formatAddress(compromised.original_owner)}).
          {compromised.incident.info_url && (
            <>
              {' '}
              <a
                href={compromised.incident.info_url}
                target='_blank'
                rel='noopener noreferrer'
                className='underline transition-opacity hover:opacity-80'
              >
                Learn more
              </a>
            </>
          )}
        </p>
        {isOriginalOwner && (
          <>
            <p className='text-md font-semibold text-red-400'>
              Your connected wallet is the original owner, so you can buy this name back or make an offer on it.
            </p>
            <RevokeApprovalsNotice approvalCheck={approvalCheck} />
          </>
        )}
      </div>
    </div>
  )
}

export default CompromisedBanner
