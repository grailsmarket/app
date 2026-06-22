import React, { useState } from 'react'
import { cn } from '@/utils/tailwind'
import { CLASSIC_BAR_H, CLASSIC_BAR_TOP, TOOLTIP_CLASS, TOOLTIP_SHADOW } from '@/constants/valuations'
import { formatEthAtScale, formatUsd } from '../../../../utils/valuation/format'
import { OUTLIER_MULT } from '@/utils/valuation/plotMath'
import type { Comp, CompGroup, Cursor, PriceScale } from '@/types/valuation'

const topBar = CLASSIC_BAR_TOP

interface BarScrubberProps {
  scale: PriceScale
  sortedComps: Comp[]
  groupByName: Map<string, CompGroup>
  estimate: number
  high: number
  axisMax: number
  ethPrice: number
  setActiveGroup: (group: CompGroup | null) => void
}

const BarScrubber: React.FC<BarScrubberProps> = ({
  scale,
  sortedComps,
  groupByName,
  estimate,
  high,
  axisMax,
  ethPrice,
  setActiveGroup,
}) => {
  const [cursor, setCursor] = useState<Cursor | null>(null)
  const { toFrac, fromFrac } = scale

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
  }

  return (
    <>
      <div
        className='absolute right-0 left-0 z-30 cursor-crosshair'
        style={{ top: topBar, height: CLASSIC_BAR_H }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setCursor(null)
          setActiveGroup(null)
        }}
      />
      {cursor && (
        <div
          className={cn(
            'pointer-events-none absolute z-40 w-px -translate-x-1/2',
            !cursor.outlier && 'bg-foreground/70'
          )}
          style={{
            left: `${cursor.leftPct}%`,
            top: topBar,
            height: CLASSIC_BAR_H,
            ...(cursor.outlier
              ? {
                  backgroundImage: 'linear-gradient(var(--color-foreground) 50%, transparent 50%)',
                  backgroundSize: '1px 4px',
                  opacity: 0.7,
                }
              : {}),
          }}
        />
      )}
      {cursor && (
        <div
          className={cn(TOOLTIP_CLASS, 'flex -translate-x-1/2 flex-col items-center')}
          style={{ left: `${cursor.leftPct}%`, top: topBar - 52, ...TOOLTIP_SHADOW }}
        >
          <span className='text-lg font-semibold'>{formatEthAtScale(cursor.price, axisMax)}</span>
          {ethPrice > 0 && (
            <span className='text-neutral text-lg font-medium'>{formatUsd(cursor.price * ethPrice)}</span>
          )}
        </div>
      )}
    </>
  )
}

export default BarScrubber
