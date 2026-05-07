import 'server-only'

import { API_URL } from '@/constants/api'
import type { APIResponseType, KeywordMetrics } from '@/types/api'
import type { ValuationSearchDemandEvidence } from '@/types/valuation'
import type { ValuationTarget } from './target'
import { valuationLogInfo, valuationLogWarn } from './log'

type GoogleMetricsResponse = APIResponseType<KeywordMetrics | null>

const NO_DATA_NOTE =
  'Google returned no keyword metrics for this term. This can mean no measurable search demand, but Google may also withhold metrics for sensitive, restricted, political, or otherwise blocked terms.'

function createSearchDemandEvidence(
  keyword: string,
  metrics: KeywordMetrics | null,
  error?: ValuationSearchDemandEvidence['error']
): ValuationSearchDemandEvidence {
  const avgMonthlySearches = metrics?.avgMonthlySearches ?? null
  const monthlyTrend = Array.isArray(metrics?.monthlyTrend) ? metrics.monthlyTrend : []
  const estimatedYearlySearches =
    monthlyTrend.length > 0
      ? Math.round((monthlyTrend.reduce((sum, point) => sum + point.searches, 0) / monthlyTrend.length) * 12)
      : null
  const hasSearchDemandData =
    avgMonthlySearches !== null || estimatedYearlySearches !== null || metrics?.avgCpc !== null
  const dataStatus = error ? 'error' : hasSearchDemandData ? 'available' : 'no_data'

  return {
    source: 'grails_google_metrics',
    keyword,
    eligible: true,
    dataStatus,
    ...(dataStatus === 'no_data' ? { note: NO_DATA_NOTE } : {}),
    summary: {
      avgMonthlySearches,
      estimatedYearlySearches,
      avgCpc: metrics?.avgCpc ?? null,
      monthlyTrendPoints: monthlyTrend.length,
    },
    monthlyTrend,
    ...(error ? { error } : {}),
  }
}

export async function buildSearchDemandEvidence(
  target: ValuationTarget,
  token: string,
  logPrefix = '[valuation]'
): Promise<ValuationSearchDemandEvidence> {
  const startedAt = performance.now()
  valuationLogInfo(logPrefix, 'Google metrics evidence request start', {
    keyword: target.keyword,
    nameId: target.nameId,
  })

  try {
    const response = await fetch(`${API_URL}/google-metrics/${encodeURIComponent(target.keyword)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const data = (await response.json().catch(() => null)) as GoogleMetricsResponse | null
    valuationLogInfo(logPrefix, 'Google metrics evidence response', {
      keyword: target.keyword,
      status: response.status,
      success: data?.success === true,
      hasData: Boolean(data?.data),
      elapsedMs: Math.round(performance.now() - startedAt),
    })

    if (!response.ok || !data?.success) {
      const error = {
        status: response.status,
        code: data?.error?.code,
        message: data?.error?.message || `Google metrics HTTP ${response.status}`,
      }
      valuationLogWarn(logPrefix, 'Google metrics evidence returned empty error evidence', {
        keyword: target.keyword,
        error,
      })
      return createSearchDemandEvidence(target.keyword, null, error)
    }

    const evidence = createSearchDemandEvidence(target.keyword, data.data ?? null)
    valuationLogInfo(logPrefix, 'Google metrics evidence complete', {
      keyword: target.keyword,
      dataStatus: evidence.dataStatus,
      avgMonthlySearches: evidence.summary.avgMonthlySearches,
      avgCpc: evidence.summary.avgCpc,
      monthlyTrendPoints: evidence.summary.monthlyTrendPoints,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    return evidence
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google metrics error'
    valuationLogWarn(logPrefix, 'Google metrics evidence failed with exception', {
      keyword: target.keyword,
      message,
      elapsedMs: Math.round(performance.now() - startedAt),
    })
    return createSearchDemandEvidence(target.keyword, null, { message })
  }
}
