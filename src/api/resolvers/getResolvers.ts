import type { Resolver, ResolverRole, ResolverAdminRole } from '@/types/ens'
import type { Address } from 'viem'
import { getWorkerAccountResolvers } from './worker'

interface GetUserResolversParams {
  userAddress: Address
  signal?: AbortSignal
}

export const getUserResolvers = async ({ userAddress, signal }: GetUserResolversParams): Promise<Resolver[]> => {
  const result = await getWorkerAccountResolvers(userAddress, signal)

  return result.resolvers.map((resolver) => ({
    address: resolver.address,
    nameCount: null,
    isDefault: false,
    roles: [
      ...resolver.roles.map((role) => `ROLE_${role.toUpperCase()}` as ResolverRole),
      ...resolver.admin_roles.map((role) => `ROLE_${role.toUpperCase()}_ADMIN` as ResolverAdminRole),
    ],
  }))
}
