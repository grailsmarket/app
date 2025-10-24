import { fetchNameDetails } from '@/api/name/details'
import { fetchNameOffers } from '@/api/name/offers'
import { useQuery } from '@tanstack/react-query'

export const useName = (name: string) => {
  const { data: nameDetails, isLoading: nameDetailsIsLoading } = useQuery({
    queryKey: ['name', 'details', name],
    queryFn: async () => await fetchNameDetails(name),
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
