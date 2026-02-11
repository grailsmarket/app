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
  categoryOverride?: string | null
  periodOverride?: AnalyticsPeriod
  sourceOverride?: AnalyticsSource
  limitOverride?: number
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

export const useTopRegistrations = (options?: UseAnalyticsOptions) => {
  const { period: reduxPeriod, source: reduxSource, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory
  const period = options?.periodOverride !== undefined ? options.periodOverride : reduxPeriod
  const source = options?.sourceOverride !== undefined ? options.sourceOverride : reduxSource
  const limit = options?.limitOverride !== undefined ? options.limitOverride : 10

  return useQuery({
    queryKey: ['analytics', 'topRegistrations', period, source, category],
    queryFn: () => fetchTopRegistrations({ period, source, category, limit }),
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

export const useRegistrationsChart = (options?: UseAnalyticsOptions) => {
  const { period, category: reduxCategory } = useAppSelector(selectAnalytics)
  const category = options?.categoryOverride !== undefined ? options.categoryOverride : reduxCategory

  return useQuery({
    queryKey: ['analytics', 'registrationsChart', period, category],
    queryFn: () => fetchRegistrationsChart({ period, category }),
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
