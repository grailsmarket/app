import { queryOptions } from '@tanstack/react-query'
import type { Address } from 'viem'
import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/constants/api'
import { activeChain } from '@/constants/web3/chain'
import type { APIResponseType } from '@/types/api'
import type { ConfigurationPreferences, ResolverPreferences, ResolverRecords } from '@/types/ens'

const requestPreferences = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await authFetch(`${API_URL}/me/resolvers${path}`, {
    ...options,
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.any([...(options.signal ? [options.signal] : []), AbortSignal.timeout(15_000)]),
  })
  const result = (await response.json().catch(() => null)) as APIResponseType<T> | null

  if (!response.ok || !result?.success)
    throw new Error(result?.error?.message || 'Could not load or save your resolver preferences. Please try again.')

  return result.data
}

export const resolverPreferencesKey = (account?: Address) =>
  ['settings', 'resolver-preferences', activeChain.id, account?.toLowerCase()] as const

export const configurationPreferencesKey = (resolver: Address, account?: Address) =>
  ['settings', 'configuration-preferences', activeChain.id, account?.toLowerCase(), resolver.toLowerCase()] as const

export const resolverPreferencesQueryOptions = (account?: Address) =>
  queryOptions({
    queryKey: resolverPreferencesKey(account),
    queryFn: ({ signal }) => requestPreferences<ResolverPreferences>('', { signal }),
    retry: false,
    staleTime: 30_000,
  })

export const configurationPreferencesQueryOptions = (resolver: Address, account?: Address) =>
  queryOptions({
    queryKey: configurationPreferencesKey(resolver, account),
    queryFn: async ({ signal }) => {
      const records: ConfigurationPreferences['records'] = []
      let offset = 0

      while (true) {
        const page = await requestPreferences<ConfigurationPreferences>(
          `/${resolver}/records?${new URLSearchParams({ limit: '100', offset: offset.toString() })}`,
          { signal }
        )
        records.push(...page.records)
        offset += page.limit

        if (offset >= page.total) return { ...page, records }
        if (!page.records.length || page.limit <= 0)
          throw new Error('The configuration API returned an incomplete page.')
        signal.throwIfAborted()
      }
    },
    retry: false,
    staleTime: 30_000,
  })

export const configurationRecords = (preferences: ConfigurationPreferences): ResolverRecords => ({
  resolver: preferences.resolver,
  record_count: preferences.recordCount,
  default_record_id: preferences.defaultRecordId,
  limit: preferences.limit,
  offset: preferences.offset,
  records: preferences.records.flatMap(({ record }) => (record ? [record] : [])),
})

export const setPreferredResolver = (address: Address | null) =>
  requestPreferences<{ preferredResolver: Address | null }>('/preferred', {
    method: 'PUT',
    body: JSON.stringify({ address }),
  })

export const setResolverLabel = (resolver: Address, label: string | null) =>
  requestPreferences<{ resolver: Address; label: string | null }>(`/${resolver}/label`, {
    method: label === null ? 'DELETE' : 'PUT',
    ...(label === null ? {} : { body: JSON.stringify({ label }) }),
  })

export const setConfigurationLabel = (resolver: Address, id: string, label: string | null) =>
  requestPreferences<{ resolver: Address; recordId: string; label: string | null }>(
    `/${resolver}/records/${id}/label`,
    {
      method: label === null ? 'DELETE' : 'PUT',
      ...(label === null ? {} : { body: JSON.stringify({ label }) }),
    }
  )
