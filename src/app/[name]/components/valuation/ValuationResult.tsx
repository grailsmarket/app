import React, { useMemo, useState } from 'react'
import { formatNumber } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { toSteppedPercent } from '@/utils/metrics'
import type { ValuationAppraisalEvidence, ValuationEvidence } from '@/types/valuation'
import ClassicPlot from './ClassicPlot'
import CircularMetric from './CircularMetric'
import { formatEth, formatSearchCount, formatUsd, toNumber } from '../../../../utils/valuation/format'
import { computeAxisMax, OUTLIER_MULT } from '@/utils/valuation/plotMath'
import type { Comp, SubjectKey } from '@/types/valuation'

interface ValuationResultProps {
  name: string
  appraisal: ValuationAppraisalEvidence
  evidence: ValuationEvidence
  ethPrice: number
}

const ValuationResult: React.FC<ValuationResultProps> = ({ name, appraisal, evidence, ethPrice }) => {
  const [statsDimmed, setStatsDimmed] = useState(false)
  const [activeSubject, setActiveSubject] = useState<SubjectKey | null>(null)
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
  const meaningsCount = evidence.nameResearch?.senses?.length
  const salesAnalysed = evidence.marketActivity?.salesFound

  const scenarios: { key: SubjectKey; label: string; eth: number; center: number; primary?: boolean }[] = [
    { key: 'low', label: 'Low', eth: low, center: 1 / 8 },
    { key: 'est', label: 'Estimate', eth: estimate, center: 1 / 2, primary: true },
    { key: 'high', label: 'High', eth: high, center: 7 / 8 },
  ]

  return (
    <div className='flex flex-col gap-4'>
      {/* name being valued */}
      <p className='text-center text-2xl font-semibold break-all'>{name}</p>

      {/* low / estimate / high — connected slider */}
      <div className='relative w-full' style={{ height: 96 }}>
        {/* connecting line: low -> est (brighter), est -> high (softer) — at the dot center */}
        <div
          className='bg-primary/50 absolute h-0.5 -translate-y-1/2'
          style={{ left: '12.5%', width: '37.5%', top: 86 }}
        />
        <div
          className='bg-primary/25 absolute h-0.5 -translate-y-1/2'
          style={{ left: '50%', width: '37.5%', top: 86 }}
        />
        {scenarios.map((s) => {
          const dimmed = activeSubject !== null && activeSubject !== s.key
          const active = activeSubject === s.key
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
              {/* USD value, shown on hover above the ETH value */}
              <div className='flex h-5 items-end'>
                {active && ethPrice > 0 && (
                  <span className='text-neutral text-sm font-medium'>{formatUsd(s.eth * ethPrice)}</span>
                )}
              </div>
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
      <div
        className={cn(
          'grid grid-cols-4 gap-3 transition-opacity',
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

      {/* disclaimer footer */}
      <p className='border-tertiary text-neutral border-t pt-3 text-lg'>
        Valuations are AI-generated estimates for informational purposes only and may be inaccurate. Not financial
        advice.
      </p>
    </div>
  )
}

export default ValuationResult
