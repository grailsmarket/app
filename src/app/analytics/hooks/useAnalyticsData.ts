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
  fetchTopRegistrations,
  fetchRegistrationsChart,
} from '@/api/analytics'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'

interface UseAnalyticsOptions {
  categoriesOverride?: string[] | null
  periodOverride?: AnalyticsPeriod
  sourceOverride?: AnalyticsSource
  limitOverride?: number
}

export const useTopListings = (options?: UseAnalyticsOptions) => {
  const { period, source, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'topListings', period, source, categories],
    queryFn: () => fetchTopListings({ period, source, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useTopOffers = (options?: UseAnalyticsOptions) => {
  const { period, source, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'topOffers', period, source, categories],
    queryFn: () => fetchTopOffers({ period, source, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useTopSales = (options?: UseAnalyticsOptions) => {
  const { period, source, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'topSales', period, source, categories],
    queryFn: () => fetchTopSales({ period, source, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useTopRegistrations = (options?: UseAnalyticsOptions) => {
  const { period: reduxPeriod, source: reduxSource, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride
  const period = options?.periodOverride !== undefined ? options.periodOverride : reduxPeriod
  const source = options?.sourceOverride !== undefined ? options.sourceOverride : reduxSource
  const limit = options?.limitOverride !== undefined ? options.limitOverride : 10

  return useQuery({
    queryKey: ['analytics', 'topRegistrations', period, source, categories],
    queryFn: () => fetchTopRegistrations({ period, source, categories, limit }),
    refetchOnWindowFocus: false,
  })
}

export const useListingsChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'listingsChart', period, categories],
    queryFn: () => fetchListingsChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useOffersChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'offersChart', period, categories],
    queryFn: () => fetchOffersChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useSalesChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'salesChart', period, categories],
    queryFn: () => fetchSalesChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useRegistrationsChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'registrationsChart', period, categories],
    queryFn: () => fetchRegistrationsChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}

export const useVolumeChart = (options?: UseAnalyticsOptions) => {
  const { period, categories: reduxCategories } = useAppSelector(selectAnalytics)
  const categories = !options?.categoriesOverride ? reduxCategories : options.categoriesOverride

  return useQuery({
    queryKey: ['analytics', 'volumeChart', period, categories],
    queryFn: () => fetchVolumeChart({ period, categories }),
    refetchOnWindowFocus: false,
  })
}
