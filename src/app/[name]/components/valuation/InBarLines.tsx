import React, { useId } from 'react'
import { CLASSIC_BAR_BOTTOM, CLASSIC_BAR_TOP } from '@/constants/valuations'
import { OUTLIER_MULT } from '@/utils/valuation/plotMath'
import type { Comp, CompGroup, SubjectKey, PriceScale } from '@/types/valuation'

const barTop = CLASSIC_BAR_TOP
const barBottom = CLASSIC_BAR_BOTTOM

interface InBarLinesProps {
  sortedComps: Comp[]
  subjects: { key: SubjectKey; v: number }[]
  activeGroup: CompGroup | null
  activeSubject: SubjectKey | null
  layoutWidth: number
  scale: PriceScale
  high: number
}

const InBarLines: React.FC<InBarLinesProps> = ({
  sortedComps,
  subjects,
  activeGroup,
  activeSubject,
  layoutWidth,
  scale,
  high,
}) => {
  const uid = useId()
  const fadeId = `inbar-fade-${uid}`
  const linkId = `inbar-link-${uid}`
  const linkUpId = `inbar-link-up-${uid}`

  return (
    <svg className='pointer-events-none absolute inset-0 h-full w-full overflow-visible'>
      <defs>
        {/* idle: brightest in the middle, fades at both ends */}
        <linearGradient id={fadeId} gradientUnits='userSpaceOnUse' x1='0' y1={barTop} x2='0' y2={barBottom}>
          <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='0' />
          <stop offset='50%' stopColor='var(--color-primary)' stopOpacity='1' />
          <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='0' />
        </linearGradient>
        {/* active: solid at the bottom so it links into the trace curve */}
        <linearGradient id={linkId} gradientUnits='userSpaceOnUse' x1='0' y1={barTop} x2='0' y2={barBottom}>
          <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='0' />
          <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='1' />
        </linearGradient>
        {/* subject: solid at the top so it links up into the brace */}
        <linearGradient id={linkUpId} gradientUnits='userSpaceOnUse' x1='0' y1={barTop} x2='0' y2={barBottom}>
          <stop offset='0%' stopColor='var(--color-primary)' stopOpacity='1' />
          <stop offset='100%' stopColor='var(--color-primary)' stopOpacity='0' />
        </linearGradient>
      </defs>
      {sortedComps.map((comp, i) => {
        const isOutlier = comp.priceEth > high * OUTLIER_MULT
        const priceX = isOutlier ? layoutWidth - 4 : scale.toFrac(comp.priceEth) * layoutWidth
        const active = activeGroup?.name === comp.name
        return (
          <g key={`inbar-${i}`}>
            <line
              x1={priceX}
              y1={barTop}
              x2={priceX}
              y2={barBottom}
              stroke={active ? `url(#${linkId})` : `url(#${fadeId})`}
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
        const fingerX = scale.toFrac(s.v) * layoutWidth
        const opacity = activeSubject === s.key ? 0.9 : 0
        return (
          <line
            key={`finger-${s.key}`}
            x1={fingerX}
            y1={barTop}
            x2={fingerX}
            y2={barBottom}
            stroke={`url(#${linkUpId})`}
            strokeOpacity={opacity}
            strokeWidth={1.5}
          />
        )
      })}
    </svg>
  )
}

export default InBarLines
