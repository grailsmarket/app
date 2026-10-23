import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { resolverQueryOptions, configurationsQueryOptions } from '@/api/resolvers/queries'
import { useMemo } from 'react'
import { useUserContext } from '@/context/user'
import { configurationRecords } from '@/api/resolvers/preferences'
import { useConfigurationPreferences } from './useResolverPreferences'

export const useResolverData = (resolver: Address, enabled = true) => {
  const { authStatus } = useUserContext()
  const preferences = useConfigurationPreferences(resolver, enabled)
  const details = useQuery({
    ...resolverQueryOptions(resolver),
    enabled,
  })

  const fallback = useQuery({
    ...configurationsQueryOptions(resolver),
    enabled: enabled && authStatus !== 'loading' && (authStatus !== 'authenticated' || preferences.isError),
  })

  const records = useMemo(() => preferences.data && configurationRecords(preferences.data), [preferences.data])
  const configurations =
    authStatus === 'authenticated' && !preferences.isError ? { ...preferences, data: records } : fallback

  return { details, configurations, preferences }
}
