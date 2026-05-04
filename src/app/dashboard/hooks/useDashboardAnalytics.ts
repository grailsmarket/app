import { useAppSelector } from '@/state/hooks'
import { selectAnalyticsListConfig, selectAnalyticsChartConfig } from '@/state/reducers/dashboard/selectors'
import {
  useTopSales,
  useTopOffers,
  useTopRegistrations,
  useSalesChart,
  useOffersChart,
  useRegistrationsChart,
} from '@/app/analytics/hooks/useAnalyticsData'

export const useDashboardTopList = (instanceId: string) => {
  const config = useAppSelector((state) => selectAnalyticsListConfig(state, instanceId))

  const salesResult = useTopSales(
    config?.type === 'top-sales'
      ? { periodOverride: config.period, sourceOverride: config.source, categoryOverride: config.category }
      : undefined
  )

  const offersResult = useTopOffers(
    config?.type === 'top-offers'
      ? { periodOverride: config.period, sourceOverride: config.source, categoryOverride: config.category }
      : undefined
  )

  const registrationsResult = useTopRegistrations(
    config?.type === 'top-registrations'
      ? { periodOverride: config.period, sourceOverride: config.source, categoryOverride: config.category }
      : undefined
  )

  if (!config) return { data: undefined, isLoading: false }

  switch (config.type) {
    case 'top-sales':
      return { data: salesResult.data, isLoading: salesResult.isLoading }
    case 'top-offers':
      return { data: offersResult.data, isLoading: offersResult.isLoading }
    case 'top-registrations':
      return { data: registrationsResult.data, isLoading: registrationsResult.isLoading }
  }
}

export const useDashboardChart = (instanceId: string) => {
  const config = useAppSelector((state) => selectAnalyticsChartConfig(state, instanceId))

  const salesResult = useSalesChart(
    config?.type === 'sales-chart' ? { periodOverride: config.period, categoryOverride: config.category } : undefined
  )

  const offersResult = useOffersChart(
    config?.type === 'offers-chart' ? { periodOverride: config.period, categoryOverride: config.category } : undefined
  )

  const registrationsResult = useRegistrationsChart(
    config?.type === 'registrations-chart'
      ? { periodOverride: config.period, categoryOverride: config.category }
      : undefined
  )

  if (!config) return { data: undefined, isLoading: false }

  switch (config.type) {
    case 'sales-chart':
      return { data: salesResult.data, isLoading: salesResult.isLoading }
    case 'offers-chart':
      return { data: offersResult.data, isLoading: offersResult.isLoading }
    case 'registrations-chart':
      return { data: registrationsResult.data, isLoading: registrationsResult.isLoading }
  }
}
