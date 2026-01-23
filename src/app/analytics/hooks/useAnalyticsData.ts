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
} from '@/api/analytics'

export const useTopListings = () => {
  const { period, source } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'topListings', period, source],
    queryFn: () => fetchTopListings({ period, source }),
    refetchOnWindowFocus: false,
  })
}

export const useTopOffers = () => {
  const { period, source } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'topOffers', period, source],
    queryFn: () => fetchTopOffers({ period, source }),
    refetchOnWindowFocus: false,
  })
}

export const useTopSales = () => {
  const { period, source } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'topSales', period, source],
    queryFn: () => fetchTopSales({ period, source }),
    refetchOnWindowFocus: false,
  })
}

export const useListingsChart = () => {
  const { period } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'listingsChart', period],
    queryFn: () => fetchListingsChart({ period }),
    refetchOnWindowFocus: false,
  })
}

export const useOffersChart = () => {
  const { period } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'offersChart', period],
    queryFn: () => fetchOffersChart({ period }),
    refetchOnWindowFocus: false,
  })
}

export const useSalesChart = () => {
  const { period } = useAppSelector(selectAnalytics)

  return useQuery({
    queryKey: ['analytics', 'salesChart', period],
    queryFn: () => fetchSalesChart({ period }),
    refetchOnWindowFocus: false,
  })
}
