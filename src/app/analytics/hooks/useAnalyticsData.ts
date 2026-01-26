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

interface UseAnalyticsOptions {
  categoryOverride?: string | null
}

export const useTopListings = (options?: UseAnalyticsOptions) => {
  const { period, source, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'topListings', period, source, category],
    queryFn: () => fetchTopListings({ period, source, category }),
    refetchOnWindowFocus: false,
  })
}

export const useTopOffers = (options?: UseAnalyticsOptions) => {
  const { period, source, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'topOffers', period, source, category],
    queryFn: () => fetchTopOffers({ period, source, category }),
    refetchOnWindowFocus: false,
  })
}

export const useTopSales = (options?: UseAnalyticsOptions) => {
  const { period, source, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'topSales', period, source, category],
    queryFn: () => fetchTopSales({ period, source, category }),
    refetchOnWindowFocus: false,
  })
}

export const useListingsChart = (options?: UseAnalyticsOptions) => {
  const { period, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'listingsChart', period, category],
    queryFn: () => fetchListingsChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}

export const useOffersChart = (options?: UseAnalyticsOptions) => {
  const { period, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'offersChart', period, category],
    queryFn: () => fetchOffersChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}

export const useSalesChart = (options?: UseAnalyticsOptions) => {
  const { period, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'salesChart', period, category],
    queryFn: () => fetchSalesChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}

export const useVolumeChart = (options?: UseAnalyticsOptions) => {
  const { period, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'volumeChart', period, category],
    queryFn: () => fetchVolumeChart({ period, category }),
    refetchOnWindowFocus: false,
  })
}
