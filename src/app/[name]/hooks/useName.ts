import { fetchNameDetails } from '@/api/name/details'
import { fetchNameOffers } from '@/api/name/offers'
import { useUserContext } from '@/context/user'
import { useQuery } from '@tanstack/react-query'

export const useName = (name: string) => {
  const { authStatus } = useUserContext()

  const { data: nameDetails, isLoading: nameDetailsIsLoading } = useQuery({
    queryKey: ['name', 'details', name, authStatus],
    queryFn: async () => await fetchNameDetails(name, authStatus === 'authenticated'),
    enabled: !!name,
  })

  const { data: nameOffers, isLoading: nameOffersIsLoading } = useQuery({
    queryKey: ['name', 'offers', name],
    queryFn: async () => await fetchNameOffers(name),
    enabled: !!name,
  })

  return {
    nameDetails,
    nameDetailsIsLoading,
    nameOffers,
    nameOffersIsLoading,
  }
}
