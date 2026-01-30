'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { ONE_HOUR } from '@/constants/time'

interface PremiumPriceGraphProps {
  expiryDate: string // ISO date string
  ethPrice: number
  targetPoint?: { date: Date; usd: number; eth: number } | null
}

interface DataPoint {
  date: Date
  usd: number
  eth: number
}

const TOTAL_HOURS = 21 * 24 // 504 hours

const PremiumPriceGraph: React.FC<PremiumPriceGraphProps> = ({ expiryDate, ethPrice, targetPoint }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 180 })

  // Responsive settings based on width
  const isMobile = dimensions.width > 0 && dimensions.width < 500

  // Generate hourly price data points
  const chartData = useMemo(() => {
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000)
    const oracle = new PremiumPriceOracle(expiryTimestamp)
    const data: DataPoint[] = []

    // Generate data points for each hour of the 21-day premium period
    for (let hour = 0; hour <= TOTAL_HOURS; hour++) {
      const timestamp = oracle.releasedDate + hour * ONE_HOUR
      const usd = oracle.getPremiumUsd(timestamp)
      const eth = ethPrice > 0 ? usd / ethPrice : 0

      data.push({
        date: new Date(timestamp * 1000),
        usd,
        eth,
      })
    }

    return data
  }, [expiryDate, ethPrice])

  // Get current price
  const currentData = useMemo(() => {
    const expiryTimestamp = Math.floor(new Date(expiryDate).getTime() / 1000)
    const oracle = new PremiumPriceOracle(expiryTimestamp)
    const now = Math.floor(Date.now() / 1000)

    if (!oracle.isInPremiumPeriod(now)) {
      return null
    }

    const usd = oracle.getPremiumUsd(now)
    const eth = ethPrice > 0 ? usd / ethPrice : 0

    return {
      date: new Date(now * 1000),
      usd,
      eth,
    }
  }, [expiryDate, ethPrice])

  // Handle resize
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) {
          // Smaller height on mobile
          const height = width < 500 ? 180 : 250
          setDimensions({ width, height })
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Draw chart
  useEffect(() => {
    if (!svgRef.current || !chartData.length || dimensions.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Responsive margins
    const margin = isMobile
      ? { top: 15, right: 50, bottom: 35, left: 45 }
      : { top: 20, right: 70, bottom: 20, left: 55 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Primary color from globals.css
    const primaryColor = '#ffdfc0'
    const primaryColorAlpha = '#ffdfc02f'

    // Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(chartData, (d) => d.date) as [Date, Date])
      .range([0, width])

    // Use power scale to compress high values and expand low values
    // This keeps the exponential curve shape but shows more detail at the bottom
    const maxUsd = d3.max(chartData, (d) => d.usd) || 100000000
    const maxEth = d3.max(chartData, (d) => d.eth) || 1

    const yScaleUsd = d3
      .scalePow()
      .exponent(0.2) // < 1 compresses top, expands bottom
      .domain([0, maxUsd])
      .range([height, 0])

    const yScaleEth = d3.scalePow().exponent(0.2).domain([0, maxEth]).range([height, 0])

    // Area generator
    const area = d3
      .area<DataPoint>()
      .x((d) => xScale(d.date))
      .y0(height)
      .y1((d) => yScaleUsd(d.usd))
      .curve(d3.curveMonotoneX)

    // Line generator
    const line = d3
      .line<DataPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScaleUsd(d.usd))
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

    // Current time vertical line
    if (currentData) {
      const currentX = xScale(currentData.date)

      // Vertical dashed line
      g.append('line')
        .attr('x1', currentX)
        .attr('x2', currentX)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', primaryColor)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')

      // Current price dot
      g.append('circle')
        .attr('cx', currentX)
        .attr('cy', yScaleUsd(currentData.usd))
        .attr('r', 5)
        .attr('fill', primaryColor)
    }

    // Target point marker (green)
    if (targetPoint) {
      const targetColor = '#22c55e' // Tailwind green-500
      const targetX = xScale(targetPoint.date)
      const targetY = yScaleUsd(targetPoint.usd)

      // Only draw if within chart bounds
      if (targetX >= 0 && targetX <= width) {
        // Vertical dashed line
        g.append('line')
          .attr('x1', targetX)
          .attr('x2', targetX)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', targetColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '4,4')

        // Target price dot
        g.append('circle')
          .attr('cx', targetX)
          .attr('cy', targetY)
          .attr('r', 6)
          .attr('fill', targetColor)
          .attr('stroke', 'white')
          .attr('stroke-width', 2)
      }
    }

    // X axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(isMobile ? 4 : 7)
      .tickFormat((d) => d3.timeFormat(isMobile ? '%m/%d' : '%b %d')(d as Date))

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .attr('class', 'text-neutral')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .style('font-size', isMobile ? '10px' : '11px')

    g.selectAll('.domain').attr('stroke', '#444444')
    g.selectAll('.tick line').attr('stroke', '#444444')

    // Y axis left (USD) - custom tick values to show more detail at lower values
    const usdTickValues = isMobile
      ? [0, 4000, 175000, 1500000, 6000000, 20000000, 50000000, 100000000]
      : [0, 1000, 25000, 200000, 1000000, 3500000, 10000000, 25000000, 50000000, 100000000]

    const formatUsd = (value: d3.NumberValue) => {
      const num = value.valueOf()
      if (num >= 1000000) return `$${(num / 1000000).toFixed(0)}M`
      if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`
      return `$${num.toFixed(0)}`
    }

    const yAxisLeft = d3.axisLeft(yScaleUsd).tickValues(usdTickValues).tickFormat(formatUsd)

    g.append('g')
      .call(yAxisLeft)
      .attr('class', 'text-neutral')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .style('font-size', isMobile ? '10px' : '11px')

    // // USD label
    // g.append('text')
    //   .attr('transform', 'rotate(-90)')
    //   .attr('y', -margin.left + 12)
    //   .attr('x', -height / 2)
    //   .attr('fill', '#888')
    //   .style('text-anchor', 'middle')
    //   .style('font-size', isMobile ? '10px' : '11px')
    //   .text('USD')

    // Y axis right (ETH) - custom tick values matching USD scale
    const ethTickValues = usdTickValues.map((usd) => (ethPrice > 0 ? usd / ethPrice : 0))

    const formatEth = (value: d3.NumberValue) => {
      const num = value.valueOf()
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`
      if (num >= 1) return `${num.toFixed(0)}`
      if (num >= 0.1) return `${num.toFixed(1)}`
      return `${num.toFixed(2)}`
    }

    const yAxisRight = d3.axisRight(yScaleEth).tickValues(ethTickValues).tickFormat(formatEth)

    g.append('g')
      .attr('transform', `translate(${width},0)`)
      .call(yAxisRight)
      .attr('class', 'text-neutral')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .style('font-size', isMobile ? '10px' : '11px')

    // ETH label
    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -width - margin.right + 12)
      .attr('x', height / 2)
      .attr('fill', '#888')
      .style('text-anchor', 'middle')
      .style('font-size', isMobile ? '10px' : '11px')
      .text('ETH')

    // Tooltip interaction
    const tooltip = d3.select(tooltipRef.current)
    const bisect = d3.bisector<DataPoint, Date>((d) => d.date).left

    const focus = g.append('g').style('display', 'none')

    focus.append('circle').attr('r', 5).attr('fill', primaryColor)
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

        const yPos = yScaleUsd(d.usd)
        focus.attr('transform', `translate(${xScale(d.date)},${yPos})`)
        focus
          .select('.x-hover-line')
          .attr('y1', -yPos)
          .attr('y2', height - yPos)

        // Shift tooltip left when near right edge
        const xPos = xScale(d.date)
        const isNearRightEdge = xPos > width - 100
        const isNearLeftEdge = xPos < 100
        const translateX = isNearRightEdge ? '-100%' : isNearLeftEdge ? '0%' : '-50%'

        const formattedUsd =
          d.usd >= 1000000
            ? `$${(d.usd / 1000000).toFixed(2)}M`
            : d.usd >= 1000
              ? `$${(d.usd / 1000).toFixed(2)}K`
              : `$${d.usd.toFixed(2)}`
        const formattedEth = d.eth >= 1 ? `${d.eth.toFixed(2)} ETH` : `${d.eth.toFixed(4)} ETH`

        tooltip
          .html(
            `<div class="text-lg font-semibold">${formattedUsd}</div>
             <div class="text-md font-medium">${formattedEth}</div>
             <div class="text-md text-neutral font-medium">${d3.timeFormat('%b %d, %Y %H:%M')(d.date)}</div>`
          )
          .style('left', `${xPos + margin.left}px`)
          .style('top', `${yPos + margin.top - 64}px`)
          .style('transform', `translateX(${translateX})`)
          .style('box-shadow', '0 4px 4px rgba(0,0,0,0.2)')
      })
  }, [chartData, currentData, dimensions, isMobile, ethPrice, targetPoint])

  if (!chartData.length) {
    return null
  }

  return (
    <div ref={containerRef} className='relative mt-4 w-full'>
      <p className='text-neutral mb-2 text-sm'>Premium Price Decay Over 21 Days</p>
      <div
        ref={tooltipRef}
        className='bg-background border-tertiary pointer-events-none absolute z-10 rounded border px-2 py-1 whitespace-nowrap opacity-0 transition-opacity'
      />
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  )
}

export default PremiumPriceGraph
