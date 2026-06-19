import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import { CLASSIC_BAR_BOTTOM, CLASSIC_BAR_H, CLASSIC_BAR_TOP, CLASSIC_CURVE_GAP, CLASSIC_TICKS_H } from './constants'
import { formatEthShort } from './format'
import { buildHeatGradient, computeTicks, createPriceScale } from './plotMath'
import BarScrubber from './BarScrubber'
import CompPills from './CompPills'
import InBarLines from './InBarLines'
import type { Comp, CompGroup, SubjectKey } from '@/types/valuation'
import type { PlotLayout } from './types'

const barTop = CLASSIC_BAR_TOP
const barBottom = CLASSIC_BAR_BOTTOM

// Defensive cap: generation already limits comps to ~25, but bound the rendered
// pill count (and the per-pill measurement/hover handlers) so a comp-heavy
// payload can't produce a runaway-tall, expensive panel.
const MAX_PILLS = 25

/**
 * Classic layout: horizontal heat bar on top, comps hang below connected to the
 * bar by price (shared x-axis). No timeline — vertical position is only used to
 * pack the name pills into rows so they don't collide.
 */
const ClassicPlot: React.FC<{
  low: number
  estimate: number
  high: number
  axisMax: number
  comps: Comp[]
  ethPrice: number
  activeSubject: SubjectKey | null
  onActiveChange?: (active: boolean) => void
}> = ({ low, estimate, high, axisMax, comps, ethPrice, activeSubject, onActiveChange }) => {
  const [activeGroup, setActiveGroup] = useState<CompGroup | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [layout, setLayout] = useState<PlotLayout | null>(null)

  // Individual sales, left -> right by price (used for the in-bar lines).
  const sortedComps = useMemo(() => [...comps].sort((a, b) => a.priceEth - b.priceEth), [comps])

  const scale = useMemo(() => createPriceScale(axisMax), [axisMax])
  const heatGradient = useMemo(
    () => buildHeatGradient(scale.toFrac(low), scale.toFrac(estimate), scale.toFrac(high)),
    [low, estimate, high, scale]
  )
  const ticks = useMemo(() => computeTicks(axisMax), [axisMax])

  // One pill per name; ordered by the name's cheapest sale.
  const allGroups = useMemo(() => {
    const byName = new Map<string, Comp[]>()
    sortedComps.forEach((comp) => {
      const existing = byName.get(comp.name)
      if (existing) existing.push(comp)
      else byName.set(comp.name, [comp])
    })
    return Array.from(byName, ([name, sales]) => ({ name, sales })).sort(
      (a, b) => a.sales[0].priceEth - b.sales[0].priceEth
    )
  }, [sortedComps])
  const groups = useMemo(() => allGroups.slice(0, MAX_PILLS), [allGroups])
  const groupByName = useMemo(() => new Map(groups.map((group) => [group.name, group] as const)), [groups])
  // Individual sales of the visible (capped) groups, left -> right by price —
  // keeps the in-bar lines + scrubber snapping in sync with the rendered pills.
  const visibleComps = useMemo(
    () => groups.flatMap((group) => group.sales).sort((a, b) => a.priceEth - b.priceEth),
    [groups]
  )

  // subject estimates mapped to box centers (boxes are 1·2·1, so ⅛, ½, ⅞)
  const subjects: { key: SubjectKey; v: number; boxCenter: number }[] = [
    { key: 'low', v: low, boxCenter: 1 / 8 },
    { key: 'est', v: estimate, boxCenter: 1 / 2 },
    { key: 'high', v: high, boxCenter: 7 / 8 },
  ]

  const registerPill = useCallback((name: string, el: HTMLDivElement | null) => {
    if (el) pillRefs.current.set(name, el)
    else pillRefs.current.delete(name)
  }, [])

  // Notify the parent so it can dim the stats the comp tooltip overlaps.
  useEffect(() => {
    onActiveChange?.(activeGroup !== null)
  }, [activeGroup, onActiveChange])

  // Measure each pill and record anchor points for the curves.
  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      if (!container) return
      const base = container.getBoundingClientRect()
      const anchors = new Map<string, { x: number; top: number }>()
      let allMeasured = true
      groups.forEach((group) => {
        const el = pillRefs.current.get(group.name)
        if (!el) {
          allMeasured = false
          return
        }
        const rect = el.getBoundingClientRect()
        anchors.set(group.name, { x: rect.left + rect.width / 2 - base.left, top: rect.top - base.top })
      })
      if (!allMeasured) return
      setLayout({ width: base.width, anchors })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [groups, axisMax])

  return (
    <div ref={containerRef} className='relative w-full'>
      {/* top region: subject connectors + bar + ticks + hover scrubber */}
      <div className='relative w-full' style={{ height: barBottom + CLASSIC_TICKS_H }}>
        {/* curvy connectors mapping the low/est/high boxes (above) to the bar */}
        {layout && (
          <svg className='pointer-events-none absolute inset-0 h-full w-full overflow-visible'>
            {subjects.map((s) => {
              const barX = scale.toFrac(s.v) * layout.width
              const boxX = s.boxCenter * layout.width
              const topY = -16 // reach up to the bottom of the boxes (gap-4 = 16px)
              const dy = topY - barTop
              const c1y = barTop + dy * 0.7
              const c2y = topY - dy * 0.7
              const opacity = activeSubject === s.key ? 0.9 : 0
              return (
                <path
                  key={s.key}
                  d={`M ${barX} ${barTop} C ${barX} ${c1y} ${boxX} ${c2y} ${boxX} ${topY}`}
                  fill='none'
                  stroke='var(--color-primary)'
                  strokeOpacity={opacity}
                  strokeWidth={1.5}
                />
              )
            })}
          </svg>
        )}

        {/* track + heat bar */}
        <div
          className='bg-tertiary/30 absolute right-0 left-0 rounded-lg'
          style={{ top: barTop, height: CLASSIC_BAR_H }}
        />
        <div
          className='absolute right-0 left-0 rounded-lg'
          style={{ top: barTop, height: CLASSIC_BAR_H, background: heatGradient }}
        />
        {/* point estimate marker */}
        <div
          className='bg-primary absolute -translate-x-1/2 rounded-full'
          style={{ left: `${scale.xPct(estimate)}%`, top: barTop, height: CLASSIC_BAR_H, width: 1.5 }}
        />

        <BarScrubber
          scale={scale}
          sortedComps={visibleComps}
          groupByName={groupByName}
          estimate={estimate}
          high={high}
          axisMax={axisMax}
          ethPrice={ethPrice}
          setActiveGroup={setActiveGroup}
        />

        {/* price ticks (below the bar) */}
        <div className='absolute right-0 left-0' style={{ top: barBottom, height: CLASSIC_TICKS_H }}>
          {ticks.map((tick, i) => (
            <span
              key={i}
              className={cn('text-neutral absolute text-lg font-medium', i === 0 ? '' : '-translate-x-1/2')}
              style={{ left: `${scale.xPct(tick)}%` }}
            >
              {tick === 0 ? '0' : formatEthShort(tick)}
            </span>
          ))}
        </div>
      </div>

      {/* "Similar sales" subheading, filling the gap; dims while a comp is hovered */}
      {groups.length > 0 && (
        <div
          className={cn(
            'text-neutral absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold transition-opacity',
            (activeGroup !== null || activeSubject !== null) && 'opacity-[0.15]'
          )}
          style={{ top: barBottom + CLASSIC_TICKS_H + CLASSIC_CURVE_GAP / 2 }}
        >
          Similar Sales
        </div>
      )}

      {/* in-bar contact lines + subject fingers — always mounted, hover-reactive */}
      {layout && (
        <InBarLines
          sortedComps={visibleComps}
          subjects={subjects}
          activeGroup={activeGroup}
          activeSubject={activeSubject}
          layoutWidth={layout.width}
          scale={scale}
          high={high}
        />
      )}

      <CompPills
        groups={groups}
        activeGroup={activeGroup}
        setActiveGroup={setActiveGroup}
        activeSubject={activeSubject}
        layout={layout}
        registerPill={registerPill}
        scale={scale}
        ethPrice={ethPrice}
        high={high}
      />
    </div>
  )
}

export default ClassicPlot
