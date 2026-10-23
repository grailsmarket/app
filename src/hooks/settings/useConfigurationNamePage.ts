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
      q,
      aggregate ? undefined : offset,
      aggregate ? undefined : limit,
      aggregate ? resolverData.details.data?.default_record_id : undefined,
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

      const names = await getConfigurationNames(params)
      return { names, total: names.length }
    },
    enabled: !aggregate || (!!resolverData.details.data && !!resolverData.configurations.data),
    retry: false,
    staleTime: 30_000,
  })

  const fallback = metadataFailed || page.isError
  const data = useConfigurationNames(resolver, fallback)
  const known = data.names.data?.names.filter((name) => matchesConfigurationName(name, id, q)) ?? []
  const availableNames = page.data?.names ?? []
  const names = fallback
    ? known.slice(offset, offset + limit)
    : aggregate
      ? availableNames.slice(offset, offset + limit)
      : availableNames
  const total = fallback ? known.length : (page.data?.total ?? 0)
  const loading = fallback ? data.names.isLoading || data.history.isLoading : page.isPending

  const retry = () => {
    if (metadataFailed) {
      void resolverData.details.refetch()
      void resolverData.configurations.refetch()
    } else void page.refetch()

    if (fallback) void data.names.refetch()
  }

  return { ...data, items: names, total, loading, fallback, retry }
}
