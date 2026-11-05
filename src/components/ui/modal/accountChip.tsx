import React from 'react'
import { Avatar, truncateAddress } from 'ethereum-identity-kit'
import LoadingCell from '@/components/ui/loadingCell'
import { type Address } from 'viem'

interface AccountChipProps {
  address?: Address
  name?: string | null
  avatar?: string | null
  loading?: boolean
}

// The resolved account under an address or ENS field.
const AccountChip: React.FC<AccountChipProps> = ({ address, name, avatar, loading }) => {
  if (loading) {
    return (
      <div className='flex items-center gap-2'>
        <LoadingCell height='24px' width='24px' radius='50%' />
        <LoadingCell height='14px' width='160px' radius='4px' />
      </div>
    )
  }

  if (!address) return null

  return (
    <div key={address} className='flex min-w-0 items-center gap-2'>
      <Avatar
        address={address}
        src={avatar ?? undefined}
        name={name ?? undefined}
        style={{ width: '24px', height: '24px' }}
      />
      <span className='min-w-0 truncate text-lg font-semibold'>{name || truncateAddress(address)}</span>
      {name && <span className='text-neutral text-md shrink-0 font-mono'>{truncateAddress(address)}</span>}
    </div>
  )
}

export default AccountChip
