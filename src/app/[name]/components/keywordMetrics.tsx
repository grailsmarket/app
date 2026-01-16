'use client'

import React, { useState } from 'react'
import { useKeywordMetrics, KeywordMetrics } from '../hooks/useKeywordMetrics'
import LoadingCell from '@/components/ui/loadingCell'

interface KeywordMetricsProps {
  name: string
}

/**
 * Format large numbers with commas
 */
function formatNumber(value: number): string {
  return value.toLocaleString()
}

/**
 * Format number to short form (1.2M, 450K, etc.)
 */
function formatShortNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

/**
 * Get short month name
 */
function getShortMonth(month: string): string {
  const monthMap: Record<string, string> = {
    JANUARY: 'Jan',
    FEBRUARY: 'Feb',
    MARCH: 'Mar',
    APRIL: 'Apr',
    MAY: 'May',
    JUNE: 'Jun',
    JULY: 'Jul',
    AUGUST: 'Aug',
    SEPTEMBER: 'Sep',
    OCTOBER: 'Oct',
    NOVEMBER: 'Nov',
    DECEMBER: 'Dec',
  }
  return monthMap[month] || month.slice(0, 3)
}

/**
 * Single bar with instant hover tooltip
 */
const ChartBar: React.FC<{ data: { month: string; year: number; searches: number }; maxSearches: number }> = ({
  data,
  maxSearches,
}) => {
  const [isBarHovered, setIsBarHovered] = useState(false)
  const height = maxSearches > 0 ? (data.searches / maxSearches) * 100 : 0

  return (
    <div
      className='relative h-full flex-1'
      onMouseEnter={() => setIsBarHovered(true)}
      onMouseLeave={() => setIsBarHovered(false)}
    >
      <div
        className='bg-primary absolute bottom-0 w-full cursor-pointer rounded-t-sm transition-all hover:opacity-70'
        style={{ height: `${Math.max(height, 4)}%` }}
      />
      {isBarHovered && (
        <div className='bg-secondary border-tertiary absolute -top-6 left-1/2 z-10 -translate-x-1/2 rounded border px-1.5 py-0.5 text-[10px] whitespace-nowrap'>
          {formatShortNumber(data.searches)}
        </div>
      )}
    </div>
  )
}

/**
 * Mini bar chart component for monthly trend with labels
 */
const TrendChart: React.FC<{ data: { month: string; year: number; searches: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return null

  const maxSearches = Math.max(...data.map((d) => d.searches), 1)

  return (
    <div className='flex gap-2'>
      {/* Y-axis labels */}
      <div className='text-neutral flex flex-col justify-between py-1 text-[10px]'>
        <span>{formatShortNumber(maxSearches)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className='flex flex-1 flex-col gap-1'>
        {/* Bars */}
        <div className='flex h-14 items-end gap-1'>
          {data.map((d, i) => (
            <ChartBar key={`${d.month}-${d.year}-${i}`} data={d} maxSearches={maxSearches} />
          ))}
        </div>
        {/* Month labels on X-axis */}
        <div className='flex justify-between'>
          {data.map((d, i) => (
            <span key={`label-${i}`} className='text-neutral flex-1 text-center text-[10px]'>
              {getShortMonth(d.month)}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Tooltip content with graph and detailed numbers - full width
 */
const TooltipContent: React.FC<{ metrics: KeywordMetrics }> = ({ metrics }) => {
  return (
    <div className='bg-secondary border-tertiary w-full rounded-lg border p-3 shadow-lg'>
      <div className='mb-2 flex items-center justify-between'>
        <p className='text-neutral text-sm'>Monthly Search Trend</p>
        <div className='flex gap-4 text-sm'>
          <span>
            <span className='text-neutral'>Avg: </span>
            <span className='font-medium'>
              {metrics.avgMonthlySearches ? formatShortNumber(metrics.avgMonthlySearches) : 'N/A'}/mo
            </span>
          </span>
          <span>
            <span className='text-neutral'>Related: </span>
            <span className='font-medium'>{formatNumber(metrics.relatedKeywordCount)}</span>
          </span>
        </div>
      </div>
      <TrendChart data={metrics.monthlyTrend} />
    </div>
  )
}

const KeywordMetricsComponent: React.FC<KeywordMetricsProps> = ({ name }) => {
  const { keywordMetrics, keywordMetricsIsLoading, keywordMetricsError, isSubdomain } = useKeywordMetrics(name)
  const [isHovered, setIsHovered] = useState(false)

  // Don't show for subdomains
  if (isSubdomain) {
    return null
  }

  // Loading state - inline, same height as buttons
  if (keywordMetricsIsLoading) {
    return (
      <div className='bg-tertiary flex h-9 w-full flex-row items-center justify-between gap-4 rounded-sm px-3 md:h-10'>
        <div className='flex items-center gap-2'>
          <LoadingCell height='16px' width='100px' />
        </div>
        <div className='flex items-center gap-2'>
          <LoadingCell height='16px' width='80px' />
        </div>
      </div>
    )
  }

  // Error or no data state - inline
  if (keywordMetricsError || !keywordMetrics) {
    return (
      <div className='bg-tertiary text-neutral flex h-9 w-full items-center justify-center rounded-sm px-3 text-sm md:h-10'>
        No search data available
      </div>
    )
  }

  // No data from API (null values)
  if (keywordMetrics.avgMonthlySearches === null && keywordMetrics.relatedKeywordCount === 0) {
    return (
      <div className='bg-tertiary text-neutral flex h-9 w-full items-center justify-center rounded-sm px-3 text-sm md:h-10'>
        No search data available
      </div>
    )
  }

  const avgSearches = keywordMetrics.avgMonthlySearches
    ? `${formatShortNumber(keywordMetrics.avgMonthlySearches)}/mo`
    : 'N/A'

  return (
    <div
      className='relative w-full'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='bg-tertiary flex h-9 w-full cursor-pointer flex-row items-center justify-between rounded-sm px-3 transition-colors hover:bg-[#4a4a4a] md:h-10'>
        {/* Google Searches Section */}
        <div className='flex items-center gap-2'>
          <span className='text-neutral'>Google Searches:</span>
          <span className='font-semibold'>{avgSearches}</span>
        </div>

        {/* Related Keywords Section */}
        <div className='flex items-center gap-2'>
          <span className='text-neutral'>Related Keywords:</span>
          <span className='font-semibold'>{formatNumber(keywordMetrics.relatedKeywordCount)}</span>
        </div>
      </div>

      {/* Hover Tooltip - Full Width */}
      {isHovered && (
        <div className='animate-fadeIn absolute top-full right-0 left-0 z-50 pt-1'>
          <TooltipContent metrics={keywordMetrics} />
        </div>
      )}
    </div>
  )
}

export default KeywordMetricsComponent

