'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useKeywordMetrics } from '@/app/[name]/hooks/useKeywordMetrics'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { formatNumber, ShortArrow } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { KeywordMetrics } from '@/types/api'

interface KeywordMetricsProps {
  name: string
  expiryDate?: string | null
}

const BAR_STEPS = 12

function toSteppedPercent(value: number, maxValue: number, steps = BAR_STEPS): number {
  if (value <= 0 || maxValue <= 0) return 0
  const normalized = Math.min(value / maxValue, 1)
  // Ease-out curve to avoid a strictly linear visual scale.
  const eased = 1 - Math.pow(1 - normalized, 1.8)
  const stepped = Math.ceil(eased * steps) / steps
  return stepped * 100
}

const MONTH_TO_INDEX: Record<string, number> = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
}

const TrendChart: React.FC<{
  data: { month: string; year: number; searches: number }[]
  avgMonthlySearches: number | null
}> = ({ data, avgMonthlySearches }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    // Sort chronologically — oldest left, current month rightmost
    const sorted = [...data].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return (MONTH_TO_INDEX[a.month.toUpperCase()] ?? 0) - (MONTH_TO_INDEX[b.month.toUpperCase()] ?? 0)
    })
    return sorted.map((p) => ({
      value: p.searches,
      label: p.month.slice(0, 3).charAt(0).toUpperCase() + p.month.slice(1, 3).toLowerCase(),
      month: p.month,
      year: p.year,
    }))
  }, [data])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) setDimensions({ width, height: 100 })
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!svgRef.current || !chartData.length || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 0, right: 6, bottom: 18, left: 6 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const primaryColor = 'var(--color-primary)'
    const n = chartData.length

    // Stroke opacity still scales with tier
    const tierPercent = toSteppedPercent(avgMonthlySearches ?? 0, 1_000_000) / 100
    const strokeOpacity = 0.25 + tierPercent * 0.55 // 0.25 → 0.80

    // Index-based scale — avoids scaleTime's requirement for chronological ordering
    const xScale = d3
      .scaleLinear()
      .domain([0, n - 1])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) || 0])
      .nice()
      .range([height, 0])

    type ChartPoint = { value: number; label: string; month: string; year: number }

    // Pre-smooth values with weighted neighbour average to reduce jaggedness
    const smoothed = chartData.map((d, i, arr) => {
      const prev = arr[i - 1]?.value ?? d.value
      const next = arr[i + 1]?.value ?? d.value
      return { ...d, value: prev * 0.2 + d.value * 0.6 + next * 0.2 }
    })

    // Absolute vertical gradient — the "full brightness" stop is anchored at the y-pixel
    // that corresponds to 1M searches on an absolute scale, regardless of the chart's
    // relative domain. A 3K keyword sits in the faint lower region; a 1M keyword spans
    // the full gradient from transparent to bright.
    const absoluteMax = 2_000_000
    const dataMax = d3.max(smoothed, (d) => d.value) || 1
    // In the chart's g-space: y=height → 0 searches, y=0 → dataMax.
    // "1M searches" maps to y = height * (1 - absoluteMax / dataMax), which will be
    // negative (above the chart) for any keyword below 1M.
    const gradientBrightY = height * (1 - absoluteMax / dataMax)
    const gradId = 'trendChartAbsGrad'

    const defs = svg.append('defs')
    const grad = defs
      .append('linearGradient')
      .attr('id', gradId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', height) // bottom: 0 searches → transparent
      .attr('x2', 0)
      .attr('y2', gradientBrightY) // "1M" position → bright
    grad.append('stop').attr('offset', '0%').attr('stop-color', primaryColor).attr('stop-opacity', 0.02)
    grad.append('stop').attr('offset', '100%').attr('stop-color', primaryColor).attr('stop-opacity', 0.65)

    const area = d3
      .area<ChartPoint>()
      .x((_, i) => xScale(i))
      .y0(height)
      .y1((d) => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    const line = d3
      .line<ChartPoint>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d.value))
      .curve(d3.curveCatmullRom.alpha(0.5))

    g.append('path').datum(smoothed).attr('fill', `url(#${gradId})`).attr('d', area)
    g.append('path')
      .datum(smoothed)
      .attr('fill', 'none')
      .attr('stroke', primaryColor)
      .attr('stroke-opacity', strokeOpacity)
      .attr('stroke-width', 1.5)
      .attr('d', line)

    // Subtle vertical line where the year changes + 3 axis labels
    const labelY = height + 12
    const labelStyle = (el: d3.Selection<SVGTextElement, unknown, null, undefined>) =>
      el.attr('fill', 'var(--color-neutral)').attr('y', labelY).style('font-size', '10px')

    // First label
    labelStyle(g.append('text').attr('x', xScale(0)).attr('text-anchor', 'start')).text(
      `${chartData[0].label} ${chartData[0].year}`
    )

    // Year-change divider + label
    chartData.forEach((d, i) => {
      if (i > 0 && d.year !== chartData[i - 1].year) {
        const xMid = (xScale(i - 1) + xScale(i)) / 2
        g.append('line')
          .attr('x1', xMid)
          .attr('x2', xMid)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', 'var(--color-neutral)')
          .attr('stroke-opacity', 0.25)
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3,3')
        labelStyle(g.append('text').attr('x', xMid).attr('text-anchor', 'middle')).text(String(d.year))
      }
    })

    // Last label
    const last = chartData[n - 1]
    labelStyle(
      g
        .append('text')
        .attr('x', xScale(n - 1))
        .attr('text-anchor', 'end')
    ).text(`${last.label} ${last.year}`)

    // Hover — focus circle + dashed vertical line + tooltip
    const tooltip = d3.select(tooltipRef.current)
    const focus = g.append('g').style('display', 'none')

    focus.append('circle').attr('r', 5).attr('fill', primaryColor)
    focus
      .append('line')
      .attr('class', 'x-hover-line')
      .attr('stroke', primaryColor)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', () => {
        focus.style('display', null)
        tooltip.style('opacity', 1)
      })
      .on('mouseout', () => {
        focus.style('display', 'none')
        tooltip.style('opacity', 0)
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event)
        const index = Math.max(0, Math.min(n - 1, Math.round(xScale.invert(mx))))
        const d = chartData[index]
        if (!d) return
        const xPos = xScale(index)

        focus.attr('transform', `translate(${xPos},${yScale(d.value)})`)
        focus
          .select('.x-hover-line')
          .attr('y1', 0)
          .attr('y2', height - yScale(d.value))

        const translateX = xPos > width - 60 ? '-100%' : xPos < 60 ? '0%' : '-50%'
        // Use .text() to avoid XSS — no .html() on API-derived content
        tooltip.selectAll('*').remove()
        tooltip.append('div').attr('class', 'text-lg font-semibold').text(d.value.toLocaleString())
        tooltip.append('div').attr('class', 'text-neutral text-sm font-medium').text(`${d.label} ${d.year}`)
        tooltip
          .style('left', `${xPos + margin.left}px`)
          .style('top', `${yScale(d.value) + margin.top - 52}px`)
          .style('transform', `translateX(${translateX})`)
          .style('box-shadow', '0 4px 4px rgba(0,0,0,0.2)')
      })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, dimensions])

  if (!data || data.length === 0) return null

  return (
    <div ref={containerRef} className='relative w-full'>
      <div
        ref={tooltipRef}
        className='bg-secondary border-tertiary pointer-events-none absolute z-10 rounded border px-2 py-1 whitespace-nowrap opacity-0 transition-opacity'
      />
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

const KeywordMetricsComponent: React.FC<KeywordMetricsProps> = ({ name, expiryDate }) => {
  const { keywordMetrics, keywordMetricsIsLoading, keywordMetricsError, isSubdomain, isTooLong } = useKeywordMetrics(
    name,
    expiryDate
  )
  const [isOpen, setIsOpen] = useState(true)

  const message = useMemo(() => {
    if (isSubdomain) return 'Not available for subnames'
    if (isTooLong) return 'Name too long'
    if (keywordMetricsError || !keywordMetrics) return 'No search data available'
    if (keywordMetrics.avgMonthlySearches === null && keywordMetrics.relatedKeywordCount === 0)
      return 'No search data available'
    return null
  }, [isSubdomain, isTooLong, keywordMetricsError, keywordMetrics])

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-3 sm:rounded-lg sm:border-2'>
      <div
        className='flex cursor-pointer flex-row items-center justify-between transition-opacity hover:opacity-80'
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className='font-sedan-sc text-3xl'>Google Metrics</h3>
        <ShortArrow className={cn('h-4 w-4 shrink-0 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
      </div>
      <div className={cn('flex-col gap-4', isOpen ? 'flex' : 'hidden')}>
        {keywordMetricsIsLoading ? (
          <LoadingSpinner size='h-10 w-10 my-4 mx-auto' />
        ) : message ? (
          <p className='text-neutral py-2 text-center text-xl font-medium'>{message}</p>
        ) : (
          <MetricsStats metrics={keywordMetrics as KeywordMetrics} />
        )}
      </div>
    </div>
  )
}

const MetricStatCard: React.FC<{ value: string; label: string; fillPercent: number }> = ({
  value,
  label,
  fillPercent,
}) => {
  const safeFill = Math.max(fillPercent, 0)
  const normalized = Math.min(safeFill / 100, 1)
  const fillOpacity = 0.72 + normalized * 0.28

  return (
    <div className='bg-secondary border-neutral sm:pl-md pb-sm flex h-fit w-full flex-col sm:border-l-2'>
      <p className='text-xl font-semibold'>{value}</p>
      <p className='text-neutral text-lg font-medium'>{label}</p>
      <div className='bg-neutral/25 relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full'>
        <div
          className='from-neutral/90 via-primary/80 to-primary absolute inset-0 rounded-full bg-linear-to-r transition-all duration-300'
          style={{
            clipPath: `inset(0 ${100 - safeFill}% 0 0)`,
            opacity: fillOpacity,
          }}
        />
      </div>
    </div>
  )
}

const MetricsStats: React.FC<{ metrics: KeywordMetrics }> = ({ metrics }) => {
  const avgSearches = metrics.avgMonthlySearches ? formatNumber(metrics.avgMonthlySearches) : 'N/A'
  const monthCount = metrics.monthlyTrend.length
  const yearlyTotal =
    monthCount > 0 ? Math.round((metrics.monthlyTrend.reduce((sum, p) => sum + p.searches, 0) / monthCount) * 12) : 0
  const monthlyFillPercent = toSteppedPercent(metrics.avgMonthlySearches ?? 0, 1_000_000)
  const yearlyFillPercent = toSteppedPercent(yearlyTotal, 12_000_000)
  const relatedFillPercent = toSteppedPercent(Math.min(metrics.relatedKeywordCount, 2_000), 2_000)
  const cpcValue = metrics.avgCpc != null ? `$${metrics.avgCpc.toFixed(2)}` : 'N/A'
  const cpcFillPercent = toSteppedPercent(Math.max((metrics.avgCpc ?? 0) - 0.1, 0), 4.9)

  return (
    <>
      <div className='grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2'>
        <MetricStatCard value={avgSearches} label='Monthly Searches' fillPercent={monthlyFillPercent} />
        <MetricStatCard value={formatNumber(yearlyTotal)} label='Yearly Average' fillPercent={yearlyFillPercent} />
        <MetricStatCard
          value={formatNumber(metrics.relatedKeywordCount)}
          label='Related Keywords'
          fillPercent={relatedFillPercent}
        />
        <MetricStatCard value={cpcValue} label='Avg CPC' fillPercent={cpcFillPercent} />
      </div>
      <TrendChart data={metrics.monthlyTrend} avgMonthlySearches={metrics.avgMonthlySearches} />
    </>
  )
}

export default KeywordMetricsComponent
