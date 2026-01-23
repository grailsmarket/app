'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { ChartDataPoint, AnalyticsSource } from '@/types/analytics'
import LoadingCell from '@/components/ui/loadingCell'

interface AnalyticsChartProps {
  title: string
  data?: ChartDataPoint[]
  source: AnalyticsSource
  isLoading: boolean
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, data, source, isLoading }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Get the correct data values based on source filter
  const chartData = useMemo(() => {
    if (!data) return []
    return data.map((point) => ({
      date: new Date(point.date),
      value: source === 'all' ? point.total : source === 'grails' ? point.grails : point.opensea,
    }))
  }, [data, source])

  // Handle resize with ResizeObserver for reliable initial dimensions
  // Re-run when isLoading changes because containerRef is only attached when data is loaded
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) {
          setDimensions({ width, height: 200 })
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [isLoading])

  // Draw chart
  useEffect(() => {
    if (!svgRef.current || !chartData.length || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Primary color from globals.css
    const primaryColor = '#ffdfc0'
    const primaryColorAlpha = '#ffdfc02f' // 30% opacity

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(chartData, (d) => d.date) as [Date, Date])
      .range([0, width])

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value) || 0])
      .nice()
      .range([height, 0])

    // Area generator
    const area = d3
      .area<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y0(height)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Line generator
    const line = d3
      .line<{ date: Date; value: number }>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX)

    // Draw area
    g.append('path').datum(chartData).attr('fill', primaryColorAlpha).attr('d', area)

    // Draw line
    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', primaryColor)
      .attr('stroke-width', 2)
      .attr('d', line)

    // X axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(chartData.length, 5))
      .tickFormat((d) => d3.timeFormat('%b %d')(d as Date))

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-neutral')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .style('font-size', '11px')

    g.selectAll('.domain').attr('stroke', '#444444')
    g.selectAll('.tick line').attr('stroke', '#444444')

    // Y axis
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format('.2s'))

    g.append('g')
      .call(yAxis)
      .attr('class', 'text-neutral')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .style('font-size', '11px')

    // Tooltip interaction
    const tooltip = d3.select(tooltipRef.current)

    const bisect = d3.bisector<{ date: Date; value: number }, Date>((d) => d.date).left

    const focus = g.append('g').style('display', 'none')

    focus.append('circle').attr('r', 6).attr('fill', primaryColor).attr('stroke-width', 2)

    focus
      .append('line')
      .attr('class', 'x-hover-line')
      .attr('stroke', 'white')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    const overlay = g
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')

    overlay
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
        const x0 = xScale.invert(mx)
        const i = bisect(chartData, x0, 1)
        const d0 = chartData[i - 1]
        const d1 = chartData[i]

        if (!d0) return

        const d = d1 && x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0

        focus.attr('transform', `translate(${xScale(d.date)},${yScale(d.value)})`)
        focus
          .select('.x-hover-line')
          .attr('y1', 0)
          .attr('y2', height - yScale(d.value))

        // Shift tooltip left when near right edge to prevent cutoff
        const xPos = xScale(d.date)
        const isNearRightEdge = xPos > width - 60
        const isNearLeftEdge = xPos < 60
        const translateX = isNearRightEdge ? '-100%' : isNearLeftEdge ? '0%' : '-50%'

        tooltip
          .html(
            `<div class="text-lg font-semibold">${d.value.toLocaleString()}</div>
             <div class="text-md text-neutral font-medium">${d3.timeFormat('%b %d, %Y')(d.date)}</div>`
          )
          .style('left', `${xPos + margin.left}px`)
          .style('top', `${yScale(d.value) + margin.top - 48}px`)
          .style('transform', `translateX(${translateX})`)
          .style('box-shadow', '0 4px 4px rgba(0,0,0,0.2)')
      })
  }, [chartData, dimensions])

  if (isLoading) {
    return (
      <div className='border-tertiary flex flex-col overflow-hidden border-b last:border-r-0 xl:border-r-2 xl:border-b-0'>
        <div className='px-4 pt-3'>
          <h3 className='text-xl font-bold'>{title}</h3>
        </div>
        <div className='flex h-[200px] items-center justify-center p-4'>
          <LoadingCell width='100%' height='160px' />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className='border-tertiary flex flex-col overflow-hidden border-b last:border-r-0 xl:border-r-2 xl:border-b-0'>
        <div className='px-4 pt-3'>
          <h3 className='text-xl font-bold'>{title}</h3>
        </div>
        <div className='flex h-auto w-full items-center justify-center'>
          <p className='text-neutral'>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className='border-tertiary flex flex-col overflow-hidden border-b last:border-r-0 xl:border-r-2 xl:border-b-0'>
      <div className='px-4 pt-3'>
        <h3 className='text-xl font-bold'>{title}</h3>
      </div>
      <div ref={containerRef} className='relative px-0 py-3'>
        <div
          ref={tooltipRef}
          className='bg-background border-tertiary pointer-events-none absolute z-10 rounded border px-2 py-1 whitespace-nowrap opacity-0 transition-opacity'
        />
        <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
      </div>
    </div>
  )
}

export default AnalyticsChart
