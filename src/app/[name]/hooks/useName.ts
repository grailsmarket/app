import { fetchNameDetails } from '@/api/name/details'
import { fetchNameOffers } from '@/api/name/offers'
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

  return {
    nameDetails,
    nameDetailsIsLoading,
    nameOffers,
    nameOffersIsLoading,
  }
}
