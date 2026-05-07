'use client'

import React, { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { formatNumber, ShortArrow } from 'ethereum-identity-kit'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { cn } from '@/utils/tailwind'
import { toSteppedPercent } from '@/utils/metrics'
import useETHPrice from '@/hooks/useETHPrice'
import { useValuationEvidence } from '../hooks/useValuationEvidence'
import { ValuationEvidenceRequestError } from '@/api/valuations/generateEvidence'
import {
  VALUATION_PROGRESS_STAGE_LABELS,
  VALUATION_PROGRESS_STAGES,
  type ValuationAppraisalEvidence,
  type ValuationEvidence,
  type ValuationEvidenceStreamStageEvent,
  type ValuationProgressStage,
} from '@/types/valuation'

const PRIMARY = 'var(--color-primary)'

// Match the Google Metrics graph tooltip styling across the panel.
const TOOLTIP_CLASS = 'bg-secondary border-tertiary pointer-events-none absolute z-50 rounded border px-2 py-1 whitespace-nowrap'
const TOOLTIP_SHADOW = { boxShadow: '0 4px 4px rgba(0,0,0,0.2)' } as const

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function formatEth(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 3,
  })} ETH`
}

function formatEthShort(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 3 : value < 10 ? 2 : 1 })
}

function formatUsd(value: number | null): string {
  if (value === null) return 'N/A'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/** Compact search-volume formatting: 1k, 10k, 100k, 1mil, 1.2mil. */
function formatSearchCount(value: number): string {
  const trim = (n: number) => Number(n.toFixed(1)).toLocaleString()
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}mil`
  if (value >= 1_000) return `${trim(value / 1_000)}k`
  return value.toLocaleString()
}

/** Decimal places appropriate to the axis scale (~2 significant figures). */
function scaleDecimals(axisMax: number): number {
  if (axisMax >= 50) return 0
  if (axisMax >= 5) return 1
  if (axisMax >= 0.1) return 2
  if (axisMax >= 0.01) return 3
  return 4
}

/** Format an ETH value at a precision suited to the scale, with stable decimals. */
function formatEthAtScale(value: number, axisMax: number): string {
  const decimals = scaleDecimals(axisMax)
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ETH`
}

// Comps priced above this multiple of the high estimate are treated as outliers:
// they don't stretch the axis and instead pin to the far right edge.
const OUTLIER_MULT = 3

/** Axis max hugs the data: highest of (high estimate, top comp) + 5%. */
function computeAxisMax(high: number, maxCompPrice: number): number {
  return Math.max(high, maxCompPrice, 1e-6) * 1.05
}

/** Round up to a "nice" number on a fine ladder (avoids snapping 2.3 -> 5). */
function niceStep(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  const step = steps.find((s) => normalized <= s + 1e-9) ?? 10
  return step * magnitude
}

const HEAT_EDGE_OFFSET = 0.05 // opacity sitting at the range edges (low/high)
const HEAT_SIGMA_K = 2.5 // the range edge sits this many sigma from the estimate

/**
 * Soft "heat" gradient across the price axis, working in fraction space (0..1
 * positions) so it's agnostic to linear/log scaling. Opacity follows a Gaussian
 * bell centred on the estimate, offset to HEAT_EDGE_OFFSET at the range edges.
 */
function buildHeatGradient(
  lowFrac: number,
  estFrac: number,
  highFrac: number,
  direction: 'to right' | 'to top' = 'to right'
): string {
  const STOPS = 32
  const span = Math.max(highFrac - lowFrac, 0)
  const sigmaLeft = (estFrac - lowFrac) / HEAT_SIGMA_K
  const sigmaRight = (highFrac - estFrac) / HEAT_SIGMA_K
  const gEdge = Math.exp(-0.5 * HEAT_SIGMA_K * HEAT_SIGMA_K)

  const bell = (f: number) => {
    const d = f - estFrac
    const sigma = d <= 0 ? sigmaLeft : sigmaRight
    if (sigma <= 0) return 1
    const g = Math.exp(-0.5 * (d / sigma) ** 2)
    const normalized = Math.max(0, (g - gEdge) / (1 - gEdge))
    return HEAT_EDGE_OFFSET + (1 - HEAT_EDGE_OFFSET) * normalized
  }

  const pct = (f: number) => (f * 100).toFixed(2)
  const stops: string[] = ['transparent 0%', `transparent ${pct(lowFrac)}%`]
  for (let i = 0; i <= STOPS; i++) {
    const f = lowFrac + (span * i) / STOPS
    const opacity = f <= lowFrac || f >= highFrac ? 0 : bell(f)
    stops.push(`color-mix(in srgb, ${PRIMARY} ${(opacity * 92).toFixed(1)}%, transparent) ${pct(f)}%`)
  }
  stops.push(`transparent ${pct(highFrac)}%`, 'transparent 100%')
  return `linear-gradient(${direction}, ${stops.join(', ')})`
}

type Comp = {
  name: string
  priceEth: number
  date: Date
}

// One pill per name; a name can have multiple sales (multiple bar positions).
type CompGroup = { name: string; sales: Comp[] }

type SubjectKey = 'low' | 'est' | 'high'

// Classic layout geometry
const CLASSIC_BAR_H = 48
const CLASSIC_TICKS_H = 18
const CLASSIC_SUBJECT_H = 28 // space above the bar for the subject curves to the boxes
const CLASSIC_CURVE_GAP = 56 // vertical room for the curved connectors between bar and pills

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
  const [cursor, setCursor] = useState<{ leftPct: number; price: number; outlier: boolean } | null>(null)
  const [activeGroup, setActiveGroup] = useState<CompGroup | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [layout, setLayout] = useState<{
    width: number
    anchors: Map<string, { x: number; top: number }>
  } | null>(null)

  // Individual sales, left -> right by price (used for the in-bar lines).
  const sortedComps = useMemo(() => [...comps].sort((a, b) => a.priceEth - b.priceEth), [comps])

  // Linear price axis from 0 to axisMax.
  const toFrac = (price: number) => Math.max(0, Math.min(1, price / axisMax))
  const fromFrac = (frac: number) => frac * axisMax
  const xPct = (price: number) => toFrac(price) * 100
  const heatGradient = useMemo(
    () => buildHeatGradient(toFrac(low), toFrac(estimate), toFrac(high)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [low, estimate, high, axisMax]
  )
  const tickStep = niceStep(axisMax / 5)
  const ticks = Array.from({ length: Math.floor(axisMax / tickStep + 1e-9) + 1 }, (_, i) => i * tickStep)
  // One pill per name; ordered by the name's cheapest sale.
  const groups = useMemo(() => {
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
  const groupByName = useMemo(() => new Map(groups.map((group) => [group.name, group] as const)), [groups])

  const barTop = CLASSIC_SUBJECT_H
  const barBottom = barTop + CLASSIC_BAR_H

  // subject estimates mapped to box centers (boxes are 1·2·1, so ⅛, ½, ⅞)
  const subjects: { key: SubjectKey; v: number; boxCenter: number }[] = [
    { key: 'low', v: low, boxCenter: 1 / 8 },
    { key: 'est', v: estimate, boxCenter: 1 / 2 },
    { key: 'high', v: high, boxCenter: 7 / 8 },
  ]

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

  const renderGroup = (group: CompGroup) => {
    const active = activeGroup === group
    // Keep the tooltip inside the panel: anchor it to the pill's left/right edge
    // when the pill sits near a panel edge, otherwise center it.
    const anchorX = layout?.anchors.get(group.name)?.x ?? 0
    const containerW = layout?.width ?? 0
    const TOOLTIP_HALF = 80
    const tooltipAlign = anchorX < TOOLTIP_HALF ? 'left' : anchorX > containerW - TOOLTIP_HALF ? 'right' : 'center'
    return (
      <div
        key={group.name}
        ref={(el) => {
          if (el) pillRefs.current.set(group.name, el)
          else pillRefs.current.delete(group.name)
        }}
        className={cn(
          'relative transition-opacity',
          active ? 'z-40' : 'z-20',
          (activeGroup !== null || activeSubject !== null) && !active && 'opacity-[0.15]'
        )}
        onMouseEnter={() => setActiveGroup(group)}
        onMouseLeave={() => setActiveGroup(null)}
      >
        <div
          className={cn(
            'bg-tertiary flex cursor-default items-center gap-1 rounded-md border px-2 py-0.5 transition-colors',
            active ? 'border-primary' : 'border-tertiary'
          )}
        >
          <span className='max-w-[120px] truncate text-lg font-normal'>{group.name}</span>
          {group.sales.length > 1 && <span className='text-neutral text-lg'>×{group.sales.length}</span>}
        </div>
        {active && (
          <div
            className={cn(
              TOOLTIP_CLASS,
              'top-full mt-1 flex flex-col items-center gap-1',
              tooltipAlign === 'left' && 'left-0',
              tooltipAlign === 'center' && 'left-1/2 -translate-x-1/2',
              tooltipAlign === 'right' && 'right-0'
            )}
            style={TOOLTIP_SHADOW}
          >
            {group.sales.map((sale, i) => {
              const usd = ethPrice > 0 ? sale.priceEth * ethPrice : null
              return (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col items-center gap-0.5',
                    i > 0 && 'border-tertiary mt-1 w-full border-t pt-1'
                  )}
                >
                  <span className='text-lg font-semibold'>
                    {formatEth(sale.priceEth)}
                    {usd !== null && <span className='text-neutral text-lg font-medium'> · {formatUsd(usd)}</span>}
                  </span>
                  <span className='text-neutral text-lg font-medium'>
                    {sale.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className='relative w-full'>
      {/* top region: valuation brace + bar + ticks + hover scrubber */}
      <div className='relative w-full' style={{ height: barBottom + CLASSIC_TICKS_H }}>
        {/* curvy connectors mapping the low/est/high boxes (above) to the bar */}
        {layout && (
          <svg className='pointer-events-none absolute inset-0 h-full w-full overflow-visible'>
            {subjects.map((s) => {
              const barX = toFrac(s.v) * layout.width
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
        <div className='bg-tertiary/30 absolute right-0 left-0 rounded-lg' style={{ top: barTop, height: CLASSIC_BAR_H }} />
        <div
          className='absolute right-0 left-0 rounded-lg'
          style={{ top: barTop, height: CLASSIC_BAR_H, background: heatGradient }}
        />
        {/* point estimate marker */}
        <div
          className='bg-primary absolute -translate-x-1/2 rounded-full'
          style={{ left: `${xPct(estimate)}%`, top: barTop, height: CLASSIC_BAR_H, width: 1.5 }}
        />

        {/* hover scrubber over the bar — snaps to nearby comps (within 2% of the scale) */}
        <div
          className='absolute right-0 left-0 z-30 cursor-crosshair'
          style={{ top: barTop, height: CLASSIC_BAR_H }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            // outliers sit at the dotted line position (width - 4), not the very end
            const outlierFrac = rect.width > 0 ? (rect.width - 4) / rect.width : 1
            const compFrac = (comp: Comp) => (comp.priceEth > high * OUTLIER_MULT ? outlierFrac : toFrac(comp.priceEth))
            let snapComp: Comp | null = null
            let snapFrac = frac
            let best = 0.02
            sortedComps.forEach((comp) => {
              const distance = Math.abs(compFrac(comp) - frac)
              if (distance <= best) {
                best = distance
                snapComp = comp
                snapFrac = compFrac(comp)
              }
            })
            const subjectDistance = Math.abs(toFrac(estimate) - frac)
            if (subjectDistance <= best) {
              best = subjectDistance
              snapComp = null
              snapFrac = toFrac(estimate)
            }
            setActiveGroup(snapComp ? (groupByName.get((snapComp as Comp).name) ?? null) : null)
            setCursor({
              leftPct: Math.min(100, snapFrac * 100),
              price: snapComp ? (snapComp as Comp).priceEth : fromFrac(snapFrac),
              outlier: snapComp ? (snapComp as Comp).priceEth > high * OUTLIER_MULT : false,
            })
          }}
          onMouseLeave={() => {
            setCursor(null)
            setActiveGroup(null)
          }}
        />
        {cursor && (
          <div
            className={cn('pointer-events-none absolute z-40 w-px -translate-x-1/2', !cursor.outlier && 'bg-foreground/70')}
            style={{
              left: `${cursor.leftPct}%`,
              top: barTop,
              height: CLASSIC_BAR_H,
              ...(cursor.outlier
                ? { backgroundImage: 'linear-gradient(var(--color-foreground) 50%, transparent 50%)', backgroundSize: '1px 4px', opacity: 0.7 }
                : {}),
            }}
          />
        )}
        {cursor && (
          <div
            className={cn(TOOLTIP_CLASS, 'flex -translate-x-1/2 flex-col items-center')}
            style={{ left: `${cursor.leftPct}%`, top: barTop - 52, ...TOOLTIP_SHADOW }}
          >
            <span className='text-lg font-semibold'>{formatEthAtScale(cursor.price, axisMax)}</span>
            {ethPrice > 0 && (
              <span className='text-neutral text-lg font-medium'>{formatUsd(cursor.price * ethPrice)}</span>
            )}
          </div>
        )}

        {/* price ticks (below the bar) */}
        <div className='absolute right-0 left-0' style={{ top: barBottom, height: CLASSIC_TICKS_H }}>
          {ticks.map((tick, i) => (
            <span
              key={i}
              className={cn('text-neutral absolute text-lg font-medium', i === 0 ? '' : '-translate-x-1/2')}
              style={{ left: `${xPct(tick)}%` }}
            >
              {tick === 0 ? '0' : formatEthShort(tick)}
            </span>
          ))}
        </div>
      </div>

      {/* "Similar sales" subheading, filling the gap; dims while a comp is hovered */}
      <div
        className={cn(
          'text-neutral absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold transition-opacity',
          (activeGroup !== null || activeSubject !== null) && 'opacity-[0.15]'
        )}
        style={{ top: barBottom + CLASSIC_TICKS_H + CLASSIC_CURVE_GAP / 2 }}
      >
        Similar Sales
      </div>

      {/* in-bar contact lines — always shown, brightest at the bar's middle */}
      {layout && (
        <svg className='pointer-events-none absolute inset-0 h-full w-full overflow-visible'>
          <defs>
            {/* idle: brightest in the middle, fades at both ends */}
            <linearGradient id='inbar-fade' gradientUnits='userSpaceOnUse' x1='0' y1={barTop} x2='0' y2={barBottom}>
              <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='0' />
              <stop offset='50%' stopColor='var(--color-primary)' stopOpacity='1' />
              <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='0' />
            </linearGradient>
            {/* active: solid at the bottom so it links into the trace curve */}
            <linearGradient id='inbar-link' gradientUnits='userSpaceOnUse' x1='0' y1={barTop} x2='0' y2={barBottom}>
              <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='0' />
              <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='1' />
            </linearGradient>
            {/* subject: solid at the top so it links up into the brace */}
            <linearGradient id='inbar-link-up' gradientUnits='userSpaceOnUse' x1='0' y1={barTop} x2='0' y2={barBottom}>
              <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='1' />
              <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='0' />
            </linearGradient>
          </defs>
          {sortedComps.map((comp, i) => {
            const isOutlier = comp.priceEth > high * OUTLIER_MULT
            const priceX = isOutlier ? layout.width - 4 : toFrac(comp.priceEth) * layout.width
            const active = activeGroup?.name === comp.name
            return (
              <g key={`inbar-${i}`}>
                <line
                  x1={priceX}
                  y1={barTop}
                  x2={priceX}
                  y2={barBottom}
                  stroke={active ? 'url(#inbar-link)' : 'url(#inbar-fade)'}
                  strokeOpacity={active ? 0.9 : 0.4}
                  strokeWidth={active ? 1.5 : 1}
                  strokeDasharray={isOutlier ? '2 2' : undefined}
                />
                {isOutlier && active && (
                  <path
                    d={`M ${priceX + 3} ${(barTop + barBottom) / 2 - 4} l 4 4 l -4 4`}
                    fill='none'
                    stroke='var(--color-primary)'
                    strokeOpacity={0.9}
                    strokeWidth={1.5}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                )}
              </g>
            )
          })}
          {/* subject fingers into the bar (low / estimate / high) — hidden until hovered */}
          {subjects.map((s) => {
            const fingerX = toFrac(s.v) * layout.width
            const opacity = activeSubject === s.key ? 0.9 : 0
            return (
              <line
                key={`finger-${s.key}`}
                x1={fingerX}
                y1={barTop}
                x2={fingerX}
                y2={barBottom}
                stroke='url(#inbar-link-up)'
                strokeOpacity={opacity}
                strokeWidth={1.5}
              />
            )
          })}
        </svg>
      )}

      {/* comp pills — one per name, bumped together, wrapping to extra rows as needed */}
      <div className='flex flex-wrap justify-center gap-1' style={{ marginTop: CLASSIC_CURVE_GAP }}>
        {groups.map((group) => renderGroup(group))}
      </div>

      {/* hover trace — a curve to each of the name's sales, above the pills */}
      {layout &&
        activeGroup &&
        (() => {
          const anchor = layout.anchors.get(activeGroup.name)
          if (!anchor) return null
          const dy = anchor.top - barBottom
          // Push the control points further from the ends so the curve stays
          // vertical longer and eases out of the bar instead of bending sharply.
          const c1y = barBottom + dy * 0.7
          const c2y = anchor.top - dy * 0.7
          return (
            <svg className='pointer-events-none absolute inset-0 z-50 h-full w-full overflow-visible'>
              {activeGroup.sales.map((sale, i) => {
                const saleOutlier = sale.priceEth > high * OUTLIER_MULT
                const priceX = saleOutlier ? layout.width - 4 : toFrac(sale.priceEth) * layout.width
                return (
                  <path
                    key={i}
                    d={`M ${priceX} ${barBottom} C ${priceX} ${c1y} ${anchor.x} ${c2y} ${anchor.x} ${anchor.top}`}
                    fill='none'
                    stroke='var(--color-primary)'
                    strokeOpacity={0.9}
                    strokeWidth={1.5}
                    strokeDasharray={saleOutlier ? '2 2' : undefined}
                  />
                )
              })}
            </svg>
          )
        })()}
    </div>
  )
}

const CircularMetric: React.FC<{ value: string; label: string; fillPercent: number }> = ({
  value,
  label,
  fillPercent,
}) => {
  const size = 72
  const stroke = 6
  const safeFill = Math.max(0, Math.min(fillPercent, 100))
  // Like the google metrics bars: the colour at the fill edge tracks the value —
  // grey at low fill, blending toward (glowing) primary as it grows.
  const fillOpacity = 0.72 + (safeFill / 100) * 0.28
  const edgeColor = `color-mix(in srgb, var(--color-primary) ${safeFill.toFixed(0)}%, var(--color-neutral))`
  const glow = (safeFill / 100) * 6
  // donut mask: keep only the outer ring of thickness `stroke`
  const ringMask = `radial-gradient(farthest-side, transparent calc(100% - ${stroke}px), #000 calc(100% - ${stroke}px))`

  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='relative' style={{ width: size, height: size }}>
        {/* track */}
        <div
          className='absolute inset-0 rounded-full'
          style={{ background: 'var(--color-neutral)', opacity: 0.25, mask: ringMask, WebkitMask: ringMask }}
        />
        {/* progress arc — grey start, brightening toward the fill edge, then transparent */}
        <div
          className='absolute inset-0 rounded-full transition-all duration-500'
          style={{
            background: `conic-gradient(from 0deg, var(--color-neutral) 0%, ${edgeColor} ${safeFill.toFixed(1)}%, transparent ${safeFill.toFixed(1)}%)`,
            opacity: fillOpacity,
            filter: glow > 0.2 ? `drop-shadow(0 0 ${glow.toFixed(1)}px var(--color-primary))` : undefined,
            mask: ringMask,
            WebkitMask: ringMask,
          }}
        />
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='text-lg font-semibold'>{value}</span>
        </div>
      </div>
      <span className='text-neutral text-center text-lg font-medium'>{label}</span>
    </div>
  )
}

const ValuationResult: React.FC<{
  name: string
  appraisal: ValuationAppraisalEvidence
  evidence: ValuationEvidence
  ethPrice: number
}> = ({ name, appraisal, evidence, ethPrice }) => {
  const [statsDimmed, setStatsDimmed] = useState(false)
  const [activeSubject, setActiveSubject] = useState<SubjectKey | null>(null)
  const [expanded, setExpanded] = useState(false)
  const low = toNumber(appraisal.lowEth)
  const estimate = toNumber(appraisal.ethValue)
  const high = toNumber(appraisal.highEth)

  const comps: Comp[] = useMemo(
    () =>
      appraisal.compsUsed
        .map((comp) => ({
          name: comp.name,
          priceEth: toNumber(comp.priceEth) ?? 0,
          date: comp.date ? new Date(comp.date) : null,
        }))
        .filter((comp): comp is Comp => comp.priceEth > 0 && comp.date !== null && !Number.isNaN(comp.date.getTime())),
    [appraisal.compsUsed]
  )

  if (low === null || estimate === null || high === null) {
    return <p className='text-neutral text-lg'>Valuation data is unavailable for this name.</p>
  }

  // Outliers (> OUTLIER_MULT * high) don't stretch the axis; they pin to the edge.
  const maxNonOutlier = comps.reduce(
    (max, comp) => (comp.priceEth <= high * OUTLIER_MULT ? Math.max(max, comp.priceEth) : max),
    0
  )
  const axisMax = computeAxisMax(high, maxNonOutlier)

  const web2Count = evidence.web2?.summary?.registeredExtensions
  const avgSearches = evidence.searchDemand?.summary?.avgMonthlySearches
  const meaningsCount = evidence.nameResearch?.senses?.length ?? evidence.nameResearch?.meanings?.length
  const salesAnalysed = evidence.marketActivity?.salesFound ?? evidence.marketActivity?.summary?.salesFound

  const scenarios: { key: SubjectKey; label: string; eth: number; center: number; primary?: boolean }[] = [
    { key: 'low', label: 'Low', eth: low, center: 1 / 8 },
    { key: 'est', label: 'Estimate', eth: estimate, center: 1 / 2, primary: true },
    { key: 'high', label: 'High', eth: high, center: 7 / 8 },
  ]

  return (
    <div className='flex flex-col gap-4'>
      {/* name being valued */}
      <p className='text-2xl font-semibold break-all text-center'>{name}</p>

      {/* low / estimate / high — connected slider */}
      <div className='relative w-full' style={{ height: 76 }}>
        {/* connecting line: low -> est (brighter), est -> high (softer) — at the dot center */}
        <div className='bg-primary/50 absolute h-0.5 -translate-y-1/2' style={{ left: '12.5%', width: '37.5%', top: 66 }} />
        <div className='bg-primary/25 absolute h-0.5 -translate-y-1/2' style={{ left: '50%', width: '37.5%', top: 66 }} />
        {scenarios.map((s) => {
          const dimmed = activeSubject !== null && activeSubject !== s.key
          return (
            <div
              key={s.key}
              onMouseEnter={() => setActiveSubject(s.key)}
              onMouseLeave={() => setActiveSubject(null)}
              className={cn(
                'absolute flex w-28 -translate-x-1/2 cursor-default flex-col items-center transition-opacity',
                dimmed && 'opacity-40'
              )}
              style={{ left: `${s.center * 100}%`, top: 0 }}
            >
              <div className='flex h-9 items-end'>
                <span className={cn('leading-none font-semibold', s.primary ? 'text-3xl' : 'text-neutral text-2xl')}>
                  {formatEth(s.eth)}
                </span>
              </div>
              <div className='flex h-4 items-center'>
                <span className='text-neutral text-sm font-medium'>{s.label}</span>
              </div>
              {/* fixed-height row so every dot center lands on the line */}
              <div className='mt-1 flex h-5 items-center justify-center'>
                <div
                  className={cn(
                    'bg-primary rounded-full',
                    s.primary ? 'ring-primary/30 h-4 w-4 ring-2' : 'h-2.5 w-2.5'
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>

      {expanded && (
        <>
          <ClassicPlot
            low={low}
            estimate={estimate}
            high={high}
            axisMax={axisMax}
            comps={comps}
            ethPrice={ethPrice}
            activeSubject={activeSubject}
            onActiveChange={setStatsDimmed}
          />

          {/* supporting signals — metric rings (same gradient as the google metrics bars) */}
          <div
            className={cn(
              'mt-4 grid grid-cols-4 gap-3 transition-opacity',
              (statsDimmed || activeSubject !== null) && 'opacity-[0.15]'
            )}
          >
            <CircularMetric
              value={web2Count != null ? formatNumber(web2Count) : 'N/A'}
              label='Web2 TLDs registered'
              fillPercent={toSteppedPercent(web2Count ?? 0, 500)}
            />
            <CircularMetric
              value={avgSearches != null ? formatSearchCount(avgSearches) : 'N/A'}
              label='Avg monthly searches'
              fillPercent={toSteppedPercent(avgSearches ?? 0, 1_000_000)}
            />
            <CircularMetric
              value={meaningsCount != null ? formatNumber(meaningsCount) : 'N/A'}
              label='Meanings'
              fillPercent={toSteppedPercent(meaningsCount ?? 0, 10)}
            />
            <CircularMetric
              value={salesAnalysed != null ? formatNumber(salesAnalysed) : 'N/A'}
              label='Sales analysed'
              fillPercent={toSteppedPercent(salesAnalysed ?? 0, 200)}
            />
          </div>

          {appraisal.reasoning && (
            <div className='border-tertiary bg-tertiary/30 flex flex-col gap-2 rounded-lg border p-4'>
              <p className='text-lg font-semibold'>Rationale</p>
              <p className='text-neutral text-lg'>{appraisal.reasoning}</p>
            </div>
          )}
        </>
      )}

      {/* disclaimer footer */}
      <p className='border-tertiary text-neutral border-t pt-3 text-lg'>
        Valuations are AI-generated estimates for informational purposes only and may be inaccurate. Not financial advice.
      </p>

      {/* expand / contract toggle */}
      <button
        type='button'
        onClick={() => setExpanded((open) => !open)}
        className='text-primary mx-auto flex items-center gap-1 text-lg font-semibold hover:opacity-80'
      >
        {expanded ? 'Show less' : 'Show details'}
        <ShortArrow className={cn('h-4 w-4 transition-transform', expanded ? 'rotate-0' : 'rotate-180')} />
      </button>
    </div>
  )
}

const ValuationProgressChecklist: React.FC<{
  progressByStage: Partial<Record<ValuationProgressStage, ValuationEvidenceStreamStageEvent>>
}> = ({ progressByStage }) => {
  return (
    <div className='border-tertiary bg-tertiary/30 flex flex-col gap-2 rounded-lg border p-3' aria-live='polite'>
      {VALUATION_PROGRESS_STAGES.map((stage) => {
        const progress = progressByStage[stage]
        const isActive = progress?.status === 'started'
        const isComplete = progress?.status === 'completed' || progress?.status === 'skipped'
        const isSkipped = progress?.status === 'skipped'

        return (
          <div key={stage} className='flex items-center gap-2 text-lg'>
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                isComplete
                  ? 'bg-primary border-primary text-background'
                  : isActive
                    ? 'border-primary text-primary'
                    : 'border-tertiary text-neutral'
              )}
            >
              {isComplete ? '✓' : isActive ? <LoadingSpinner size='h-3 w-3' /> : ''}
            </span>
            <span className={cn(isComplete || isActive ? 'text-foreground' : 'text-neutral')}>
              {VALUATION_PROGRESS_STAGE_LABELS[stage]}
              {isSkipped && <span className='text-neutral'> skipped</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const ValuationRangePanel: React.FC<{ name: string }> = ({ name }) => {
  const { ethPrice } = useETHPrice()

  const {
    generateEvidence,
    valuationEvidence,
    valuationEvidenceError,
    valuationEvidenceProgress,
    valuationEvidenceProgressByStage,
    valuationEvidenceIsLoading,
    valuationEvidenceIsInitialLoading,
    hasResult,
    loginRequired,
  } = useValuationEvidence(name)

  const errorMessage = useMemo(() => {
    if (!valuationEvidenceError) return null
    if (valuationEvidenceError instanceof ValuationEvidenceRequestError) return valuationEvidenceError.message
    return 'Failed to generate valuation evidence'
  }, [valuationEvidenceError])

  const appraisal = valuationEvidence?.evidence.appraisal

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    generateEvidence(hasResult)
  }

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div className='flex flex-row items-center justify-between gap-2'>
        <h2 className='font-sedan-sc text-3xl'>
          Valuation <span className='text-neutral text-sm'>beta</span>
        </h2>
        <span className='text-neutral text-lg'>✨ GrailsAI</span>
      </div>

      {/* CTA only shown until a valuation exists (refresh is disabled) */}
      {!hasResult &&
        (valuationEvidenceIsInitialLoading ? (
          <div className='border-tertiary bg-tertiary/30 text-neutral flex h-10 w-full items-center justify-center gap-2 rounded-md border text-lg font-medium'>
            <LoadingSpinner size='h-4 w-4' />
            Checking for existing valuation
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <button
              type='submit'
              className={cn(
                'bg-primary text-background flex h-10 w-full cursor-pointer items-center justify-center rounded-md px-4 text-lg font-semibold transition hover:opacity-90 active:scale-[0.99]',
                (valuationEvidenceIsLoading || loginRequired) && 'cursor-not-allowed opacity-60'
              )}
              disabled={valuationEvidenceIsLoading || loginRequired}
            >
              {valuationEvidenceIsLoading ? (
                <span className='flex items-center gap-2'>
                  <LoadingSpinner size='h-4 w-4' />
                  {valuationEvidenceProgress?.label ?? 'Generating valuation'}
                </span>
              ) : (
                'Generate valuation'
              )}
            </button>
          </form>
        ))}

      {valuationEvidenceIsLoading && (
        <ValuationProgressChecklist progressByStage={valuationEvidenceProgressByStage} />
      )}

      {loginRequired && !hasResult && !valuationEvidenceIsInitialLoading && (
        <p className='text-neutral text-lg'>Sign in to generate a valuation.</p>
      )}
      {errorMessage && <p className='text-lg font-medium text-red-400'>{errorMessage}</p>}

      {appraisal && (
        <ValuationResult name={name} appraisal={appraisal} evidence={valuationEvidence!.evidence} ethPrice={ethPrice} />
      )}
    </div>
  )
}

export default ValuationRangePanel
