import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { getConfigurationNamePage, getConfigurationNames } from '@/api/resolvers/names'
import { matchesConfigurationName } from '@/utils/settings/resolverData'
import { useConfigurationNames } from './useConfigurationNames'
import { useResolverData } from './useResolverData'

interface UseConfigurationNamePageParams {
  resolver: Address
  id?: bigint
  q: string
  offset: number
  limit: number
}

export const useConfigurationNamePage = ({ resolver, id, q, offset, limit }: UseConfigurationNamePageParams) => {
  const resolverData = useResolverData(resolver)
  const aggregate = id === undefined || id === BigInt(0)
  const metadataFailed = aggregate && (resolverData.details.isError || resolverData.configurations.isError)

  const page = useQuery({
    queryKey: [
      'settings',
      'configuration-name-page',
      activeChain.id,
      resolver,
      id?.toString(),
      aggregate ? undefined : q,
      aggregate ? undefined : offset,
      aggregate ? undefined : limit,
      aggregate ? resolverData.details.data?.default_record_id : undefined,
      aggregate ? resolverData.details.data?.unlinked_name_count : undefined,
      aggregate ? resolverData.configurations.data?.record_count : undefined,
    ],
    queryFn: async ({ signal }) => {
      const params = {
        resolver,
        id,
        q,
        offset,
        limit,
        signal,
        details: resolverData.details.data,
        configurations: resolverData.configurations.data,
      }

      if (!aggregate) return getConfigurationNamePage(params)

      // Keep the full membership list so picker exclusions do not depend on the table's search or page.
      return getConfigurationNames({ ...params, q: '' })
    },
    enabled: !aggregate || (!!resolverData.details.data && !!resolverData.configurations.data),
    retry: false,
    staleTime: 30_000,
  })

  const apiFailed = metadataFailed || page.isError
  const unlinkedNamesUnavailable = !apiFailed && !!page.data?.unlinkedNamesUnavailable
  const fallback = apiFailed || unlinkedNamesUnavailable
  const data = useConfigurationNames(resolver, fallback)
  const apiNames = page.data?.names ?? []
  const onchainNames = data.names.data?.names ?? []
  const allNames = apiFailed
    ? onchainNames
    : unlinkedNamesUnavailable
      ? [
          ...new Map(
            [...onchainNames.filter((name) => name.recordId === BigInt(0)), ...apiNames].map((name) => [
              name.name,
              name,
            ])
          ).values(),
        ].sort((left, right) => left.name.localeCompare(right.name))
      : apiNames
  const availableNames = allNames.filter((name) => matchesConfigurationName(name, id, q))
  const names = fallback
    ? availableNames.slice(offset, offset + limit)
    : aggregate
      ? availableNames.slice(offset, offset + limit)
      : availableNames
  const total = fallback || aggregate ? availableNames.length : (page.data?.total ?? 0)
  const loading = (!apiFailed && page.isPending) || (fallback && (data.names.isLoading || data.history.isLoading))

  const retry = () => {
    if (metadataFailed || unlinkedNamesUnavailable) {
      void resolverData.details.refetch()
      void resolverData.configurations.refetch()
    }

    if (!metadataFailed) void page.refetch()

    if (fallback) void data.names.refetch()
  }

  return { ...data, items: names, allNames, total, loading, fallback, unlinkedNamesUnavailable, retry }
}
