'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'
import { activeChain } from '@/constants/web3/chain'
import { ensApi } from '@/api/ens-v2'
import type { Address } from 'viem'

export const resolverKey = (wallet?: Address) => ['ens-v2', activeChain.id, wallet?.toLowerCase()] as const

export function useUserResolvers(search = '') {
  const { userAddress, authStatus } = useUserContext()
  return useInfiniteQuery({
    queryKey: [...resolverKey(userAddress), 'resolvers', search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => ensApi.resolvers(activeChain.id, search, pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!userAddress && authStatus === 'authenticated',
    retry: false,
  })
}

export function useResolver(resolver?: Address) {
  const { userAddress, authStatus } = useUserContext()
  return useQuery({
    queryKey: [...resolverKey(userAddress), 'resolver', resolver],
    queryFn: () => ensApi.resolver(activeChain.id, resolver!),
    enabled: !!resolver && authStatus === 'authenticated',
    retry: false,
  })
}

export function useConfigurations(resolver?: Address) {
  const { userAddress, authStatus } = useUserContext()
  return useInfiniteQuery({
    queryKey: [...resolverKey(userAddress), 'configurations', resolver],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => ensApi.configurations(activeChain.id, resolver!, pageParam),
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: !!resolver && authStatus === 'authenticated',
    retry: false,
  })
}

export function useConfiguration(resolver?: Address, recordId?: string) {
  const { userAddress, authStatus } = useUserContext()
  return useQuery({
    queryKey: [...resolverKey(userAddress), 'configuration', resolver, recordId],
    queryFn: () => ensApi.configuration(activeChain.id, resolver!, recordId!),
    enabled: !!resolver && !!recordId && recordId !== '0' && authStatus === 'authenticated',
    retry: false,
  })
}

export function useResolverPreferences() {
  const { userAddress, authStatus } = useUserContext()
  return useQuery({
    queryKey: [...resolverKey(userAddress), 'preferences'],
    queryFn: () => ensApi.preferences(activeChain.id),
    enabled: !!userAddress && authStatus === 'authenticated',
    retry: false,
  })
}
