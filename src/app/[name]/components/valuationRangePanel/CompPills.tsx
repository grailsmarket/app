import React from 'react'
import { cn } from '@/utils/tailwind'
import { CLASSIC_BAR_BOTTOM, CLASSIC_CURVE_GAP, TOOLTIP_CLASS, TOOLTIP_SHADOW } from './constants'
import { formatEth, formatUsd } from './format'
import { OUTLIER_MULT } from './plotMath'
import type { CompGroup, SubjectKey } from '@/types/valuation'
import type { PlotLayout, PriceScale } from './types'

const barBottom = CLASSIC_BAR_BOTTOM

/**
 * The comp layer below the bar: one pill per name (bumped together, wrapping to
 * extra rows), a per-name tooltip on hover, and the curved connectors tracing
 * each of a name's sales up to the bar.
 */
const CompPills: React.FC<{
  groups: CompGroup[]
  activeGroup: CompGroup | null
  setActiveGroup: (group: CompGroup | null) => void
  activeSubject: SubjectKey | null
  layout: PlotLayout | null
  registerPill: (name: string, el: HTMLDivElement | null) => void
  scale: PriceScale
  ethPrice: number
  high: number
}> = ({ groups, activeGroup, setActiveGroup, activeSubject, layout, registerPill, scale, ethPrice, high }) => {
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
        ref={(el) => registerPill(group.name, el)}
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
    <>
      {/* comp pills — one per name, bumped together, wrapping to extra rows as needed */}
      <div
        className='flex flex-wrap justify-center gap-1'
        style={{ marginTop: groups.length > 0 ? CLASSIC_CURVE_GAP : 0 }}
      >
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
                const priceX = saleOutlier ? layout.width - 4 : scale.toFrac(sale.priceEth) * layout.width
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
    </>
  )
}

export default CompPills
