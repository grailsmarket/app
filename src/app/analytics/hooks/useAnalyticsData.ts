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
  categoriesOverride?: string[]
}

export const useTopListings = (options?: UseAnalyticsOptions) => {
  const { period, source, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'topListings', period, source, categories],
    queryFn: () => fetchTopListings({ period, source, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useTopOffers = (options?: UseAnalyticsOptions) => {
  const { period, source, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'topOffers', period, source, categories],
    queryFn: () => fetchTopOffers({ period, source, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useTopSales = (options?: UseAnalyticsOptions) => {
  const { period, source, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'topSales', period, source, categories],
    queryFn: () => fetchTopSales({ period, source, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useListingsChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'listingsChart', period, categories],
    queryFn: () => fetchListingsChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useOffersChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'offersChart', period, categories],
    queryFn: () => fetchOffersChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useSalesChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'salesChart', period, categories],
    queryFn: () => fetchSalesChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useVolumeChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = options?.categoriesOverride !== undefined ? options.categoriesOverride : reduxCategories

  return useQuery({
    queryKey: ['analytics', 'volumeChart', period, categories],
    queryFn: () => fetchVolumeChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}
