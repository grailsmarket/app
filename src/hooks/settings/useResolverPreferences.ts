import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { useUserContext } from '@/context/user'
import {
  configurationPreferencesKey,
  configurationPreferencesQueryOptions,
  resolverPreferencesKey,
  resolverPreferencesQueryOptions,
  setConfigurationLabel,
  setPreferredResolver,
  setResolverLabel,
} from '@/api/resolvers/preferences'
import type { ConfigurationPreferences, ResolverPreferences } from '@/types/ens'
import { resolverLabel } from '@/utils/settings/labels'

export const useResolverPreferences = (enabled = true) => {
  const { userAddress, authStatus } = useUserContext()
  const account = authStatus === 'authenticated' ? userAddress : undefined
  const query = useQuery({
    ...resolverPreferencesQueryOptions(account),
    enabled: !!account && enabled,
  })

  return { ...query, account, authStatus }
}

export const useConfigurationPreferences = (resolver?: Address, enabled = true) => {
  const { userAddress, authStatus } = useUserContext()
  const account = authStatus === 'authenticated' ? userAddress : undefined

  const query = useQuery({
    ...configurationPreferencesQueryOptions(resolver ?? '0x0000000000000000000000000000000000000000', account),
    enabled: !!account && !!resolver && enabled,
  })

  return { ...query, account }
}

type PreferenceChange = { account: Address } & (
  | { type: 'preferred'; resolver: Address | null }
  | { type: 'resolver-label'; resolver: Address; label: string | null }
  | { type: 'configuration-label'; resolver: Address; id: string; label: string | null }
)

export const useUpdateResolverPreferences = () => {
  const queries = useQueryClient()

  const updateLabel = (account: Address, resolver: Address, label: string | null) => {
    queries.setQueryData<ResolverPreferences>(resolverPreferencesKey(account), (previous) => {
      if (!previous) return previous

      return {
        ...previous,
        preferred:
          previous.preferred?.address.toLowerCase() === resolver.toLowerCase()
            ? { ...previous.preferred, label }
            : previous.preferred,
        resolvers: previous.resolvers.map((item) =>
          item.address.toLowerCase() === resolver.toLowerCase() ? { ...item, label } : item
        ),
      }
    })
  }

  const updateConfigurationLabel = (account: Address, resolver: Address, id: string, label: string | null) => {
    queries.setQueryData<ConfigurationPreferences>(configurationPreferencesKey(resolver, account), (previous) =>
      previous
        ? {
            ...previous,
            records: previous.records.map((record) => (record.recordId === id ? { ...record, label } : record)),
          }
        : previous
    )
  }

  return useMutation({
    mutationFn: async (change: PreferenceChange) => {
      if (change.type === 'preferred') return setPreferredResolver(change.resolver)
      if (change.label !== null && (!change.label.trim() || change.label.length > 64))
        throw new Error('Labels must contain between 1 and 64 characters.')
      if (change.type === 'resolver-label') return setResolverLabel(change.resolver, change.label)
      return setConfigurationLabel(change.resolver, change.id, change.label)
    },
    onMutate: async (change) => {
      if (change.type === 'preferred') return

      if (change.type === 'configuration-label') {
        const key = configurationPreferencesKey(change.resolver, change.account)
        await queries.cancelQueries({ queryKey: key, exact: true })
        const previous = queries.getQueryData<ConfigurationPreferences>(key)

        if (!previous) return

        const previousLabel = previous.records.find((record) => record.recordId === change.id)?.label ?? null
        updateConfigurationLabel(change.account, change.resolver, change.id, change.label)

        return { previousLabel }
      }

      const key = resolverPreferencesKey(change.account)
      await queries.cancelQueries({ queryKey: key, exact: true })
      const previous = queries.getQueryData<ResolverPreferences>(key)

      if (!previous) return

      const previousLabel = resolverLabel(previous, change.resolver)
      updateLabel(change.account, change.resolver, change.label)

      return { previousLabel }
    },
    onError: (_, change, context) => {
      if (!context) return

      if (change.type === 'resolver-label') updateLabel(change.account, change.resolver, context.previousLabel)
      if (change.type === 'configuration-label')
        updateConfigurationLabel(change.account, change.resolver, change.id, context.previousLabel)
    },
    onSettled: (_, __, change) => {
      if (change.type === 'resolver-label')
        void queries.invalidateQueries({ queryKey: resolverPreferencesKey(change.account), exact: true })
      if (change.type === 'configuration-label')
        void queries.invalidateQueries({
          queryKey: configurationPreferencesKey(change.resolver, change.account),
          exact: true,
        })
    },
    onSuccess: (_, change) => {
      if (change.type !== 'preferred') return

      const key = resolverPreferencesKey(change.account)

      queries.setQueryData<ResolverPreferences>(key, (previous) => {
        if (!previous) return previous

        const address = change.resolver?.toLowerCase()
        const target = previous.resolvers.find((item) => item.address.toLowerCase() === address)
        const preferred = change.resolver
          ? { address: change.resolver, label: target?.label ?? null, hasRoles: !!target?.resolver.manages_records }
          : null

        return {
          ...previous,
          preferred,
          resolvers: previous.resolvers
            .map((item) => ({
              ...item,
              isPreferred: item.address.toLowerCase() === address,
            }))
            .sort((a, b) => Number(b.isPreferred) - Number(a.isPreferred)),
        }
      })
      void queries.invalidateQueries({ queryKey: key })
    },
  })
}
