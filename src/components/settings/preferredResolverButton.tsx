'use client'

import type { Address } from 'viem'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useResolverPreferences, useUpdateResolverPreferences } from '@/hooks/settings/useResolverPreferences'
import { QueryError } from './shared'

interface PreferredResolverButtonProps {
  resolver: Address
}

const PreferredResolverButton: React.FC<PreferredResolverButtonProps> = ({ resolver }) => {
  const preferences = useResolverPreferences()
  const mutation = useUpdateResolverPreferences()
  const preferred = preferences.data?.preferred?.address.toLowerCase() === resolver.toLowerCase()
  const managesRecords = preferences.data?.resolvers.find(
    (item) => item.address.toLowerCase() === resolver.toLowerCase()
  )?.resolver.manages_records

  if (!preferences.account || (!preferred && !managesRecords)) return null

  return (
    <div className='relative z-10 flex flex-col gap-2' onClick={(event) => event.stopPropagation()}>
      <SecondaryButton
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate({
            type: 'preferred',
            account: preferences.account!,
            resolver: preferred ? null : resolver,
          })
        }
      >
        {mutation.isPending ? 'Saving…' : preferred ? 'Clear preferred' : 'Set preferred'}
      </SecondaryButton>
      {mutation.isError && <QueryError error={mutation.error} />}
    </div>
  )
}

export default PreferredResolverButton
