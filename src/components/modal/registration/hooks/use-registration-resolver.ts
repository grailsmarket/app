import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAddress, type Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { resolverPreferencesQueryOptions } from '@/api/resolvers/preferences'
import { useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'

interface UseRegistrationResolverProps {
  owner?: Address
  input: string | null
  committedResolver?: Address | null
  enabled: boolean
}

export const useRegistrationResolver = ({ owner, input, committedResolver, enabled }: UseRegistrationResolverProps) => {
  const { address } = useAccount()
  const queries = useQueryClient()
  const directory = useResolverDirectory(false, enabled)
  const preferences = directory.preferences
  const { isUserResolverDeployed } = usePermissionedResolver()
  const ownRegistration = !!owner && owner.toLowerCase() === address?.toLowerCase()
  const preferred = ownRegistration ? directory.preferred : undefined
  const loadingPreferences = ownRegistration && (preferences.authStatus === 'loading' || preferences.isLoading)
  const automatic = useQuery({
    queryKey: ['registration', 'resolver', activeChain.id, owner],
    queryFn: () => isUserResolverDeployed(0, owner),
    enabled: enabled && !!owner && !loadingPreferences && !preferred,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const resolver = committedResolver ?? input ?? preferred?.address ?? (automatic.data || '')
  const isCheckingResolver = enabled && input === null && (loadingPreferences || (!preferred && automatic.isLoading))
  const options = new Map(directory.resolvers.map((item) => [item.address.toLowerCase(), item]))

  if (automatic.data && !options.has(automatic.data.toLowerCase()))
    options.set(automatic.data.toLowerCase(), {
      address: automatic.data,
      nameCount: null,
      roles: [],
      isDefault: false,
    })

  const getDefaultResolver = async () => {
    if (ownRegistration && preferences.account) {
      try {
        const saved = await queries.fetchQuery(resolverPreferencesQueryOptions(preferences.account))
        if (saved.preferred) return saved.preferred.address
      } catch {
        // Saved preferences are optional; use the existing deterministic resolver on API failure.
      }
    }

    return isUserResolverDeployed(0, owner)
  }

  return {
    resolver,
    getDefaultResolver,
    isCheckingResolver,
    options: [...options.values()],
    error:
      resolver.trim() && !isAddress(resolver.trim(), { strict: false })
        ? 'Enter a valid resolver address.'
        : !resolver.trim() && automatic.isError
          ? 'Could not check the automatic resolver. Try again or enter an address.'
          : null,
    warning:
      directory.preferred &&
      !directory.preferred.hasRoles &&
      resolver.toLowerCase() === directory.preferred.address.toLowerCase()
        ? 'You no longer have access to manage records on your preferred resolver. You can still use it or choose another.'
        : ownRegistration && preferences.isError
          ? 'Your saved resolver preference could not be loaded. You can enter an address or use the automatic resolver.'
          : null,
  }
}
