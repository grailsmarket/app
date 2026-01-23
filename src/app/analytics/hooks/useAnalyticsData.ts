import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectAnalytics } from '@/state/reducers/analytics'
import {
  fetchTopListings,
  fetchTopOffers,
  fetchTopSales,
  fetchListingsChart,
  fetchOffersChart,
  fetchSalesChart,
  fetchVolumeChart,
} from '@/api/analytics'

export const useTopListings = () => {
  const { period, source, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'topListings', period, source, category],
    queryFn: () => fetchTopListings({ period, source, category }),
    refetchOnWindowFocus: false,
  })
}

export const useTopOffers = () => {
  const { period, source, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'topOffers', period, source, category],
    queryFn: () => fetchTopOffers({ period, source, category }),
    refetchOnWindowFocus: false,
  })
}

export const useTopSales = () => {
  const { period, source, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'topSales', period, source, category],
    queryFn: () => fetchTopSales({ period, source, category }),
    refetchOnWindowFocus: false,
  })
}

export const useListingsChart = () => {
  const { period, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'listingsChart', period, category],
    queryFn: () => fetchListingsChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}

export const useOffersChart = () => {
  const { period, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'offersChart', period, category],
    queryFn: () => fetchOffersChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}

export const useSalesChart = () => {
  const { period, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'salesChart', period, category],
    queryFn: () => fetchSalesChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}

export const useVolumeChart = () => {
  const { period, category } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'volumeChart', period, category],
    queryFn: () => fetchVolumeChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}
