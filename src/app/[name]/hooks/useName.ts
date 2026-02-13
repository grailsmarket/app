import { fetchNameDetails } from '@/api/name/details'
import { fetchNameMetadata } from '@/api/name/metadata'
import { fetchNameOffers } from '@/api/name/offers'
import { fetchNameRoles } from '@/api/name/roles'
import { MetadataType } from '@/types/api'
import { useQuery } from '@tanstack/react-query'

export const useName = (name: string) => {
  const { data: nameDetails, isLoading: nameDetailsIsLoading } = useQuery({
    queryKey: ['name', 'details', name],
    queryFn: async () => {
      const details = await fetchNameDetails(name)
      return details
    },
    enabled: !!name,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  })

  const { data: nameOffers, isLoading: nameOffersIsLoading } = useQuery({
    queryKey: ['name', 'offers', name],
    queryFn: async () => {
      const offers = await fetchNameOffers(name)
      return offers
    },
    enabled: !!name,
    refetchOnWindowFocus: true,
  })

  const { data: metadata, isLoading: isMetadataLoading } = useQuery({
    queryKey: ['name', 'metadata', name],
    queryFn: async () => {
      const result = await fetchNameMetadata(name)
      const metadata = Object.entries(result || {})
        .flatMap(([key, value]) => {
          if (key === 'chains') {
            return value.map(({ chainName, address }: { chainName: string; address: string }) => ({
              label: chainName,
              value: address,
              canCopy: true,
            }))
          }

          if (key === 'contenthash') {
            return {
              label: key,
              value: `${value.protocol}://${value.value}`,
              canCopy: true,
            }
          }

          return {
            label: key,
            value: value,
            canCopy: true,
          }
        })
        .filter((row) => typeof row.value === 'string' && row.value.length > 0 && row.label !== 'resolverAddress')

      return metadata as MetadataType[]
    },
    enabled: !!name,
  })

  const { data: roles, isLoading: isRolesLoading } = useQuery({
    queryKey: ['name', 'roles', name],
    queryFn: async () => {
      const details = await fetchNameRoles(name)
      return details
    },
    enabled: !!name,
  })

  return {
    nameDetails,
    nameDetailsIsLoading,
    nameOffers,
    nameOffersIsLoading,
    metadata,
    isMetadataLoading,
    roles,
    isRolesLoading,
  }
}
