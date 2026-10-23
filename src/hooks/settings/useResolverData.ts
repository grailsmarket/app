import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { resolverQueryOptions, configurationsQueryOptions } from '@/api/resolvers/queries'

export const useResolverData = (resolver: Address, enabled = true) => {
  const details = useQuery({
    ...resolverQueryOptions(resolver),
    enabled,
  })

  const configurations = useQuery({
    ...configurationsQueryOptions(resolver),
    enabled,
  })

  return { details, configurations }
}
