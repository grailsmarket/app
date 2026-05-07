'use client'

import React, { FormEvent, useMemo, useState } from 'react'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { useValuationEvidence } from '../hooks/useValuationEvidence'
import { ValuationEvidenceRequestError } from '@/api/valuations/generateEvidence'
import { cn } from '@/utils/tailwind'
import useETHPrice from '@/hooks/useETHPrice'
import { toSteppedPercent } from '@/utils/metrics'
import {
  VALUATION_PROGRESS_STAGE_LABELS,
  VALUATION_PROGRESS_STAGES,
  type ValuationAppraisalEvidence,
  type ValuationEvidence,
  type ValuationEvidenceStreamStageEvent,
  type ValuationProgressStage,
} from '@/types/valuation'

const DEFAULT_RECOMMENDATION_COUNT = 200
const DEFAULT_PREMIUM_FLOOR = '0.1'

function formatUsd(value: number | null) {
  if (value === null) return 'N/A'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

function formatEthNumber(value: number | null) {
  if (value === null || !Number.isFinite(value)) return 'N/A'
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 3,
  })} ETH`
}

const ValuationScenarioCard: React.FC<{
  ethValue: number | null
  usdValue: number | null
  label: string
  isPrimary?: boolean
}> = ({ ethValue, usdValue, label, isPrimary }) => {
  return (
    <div
      className={cn(
        'border-tertiary flex flex-col rounded-lg border p-4',
        isPrimary ? 'bg-primary/10 border-primary/40' : 'bg-tertiary/50'
      )}
    >
      <p className={cn('font-semibold', isPrimary ? 'text-3xl' : 'text-2xl')}>{formatEthNumber(ethValue)}</p>
      <p className='text-neutral mt-1 text-sm font-medium'>{formatUsd(usdValue)}</p>
      <p className='text-neutral mt-2 text-sm font-semibold'>{label}</p>
    </div>
  )
}

const EvidenceBulletList: React.FC<{ title: string; items: string[]; emptyLabel?: string }> = ({
  title,
  items,
  emptyLabel,
}) => {
  return (
    <div className='flex flex-col gap-2'>
      <p className='text-neutral text-sm font-semibold tracking-wide uppercase'>{title}</p>
      {items.length === 0 ? (
        emptyLabel ? (
          <p className='text-neutral text-sm'>{emptyLabel}</p>
        ) : null
      ) : (
        <ul className='flex list-disc flex-col gap-1 pl-5 text-sm'>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
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
          <div key={stage} className='flex items-center gap-2 text-sm'>
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
            <span className={cn(isComplete || isActive ? 'text-text' : 'text-neutral')}>
              {VALUATION_PROGRESS_STAGE_LABELS[stage]}
              {isSkipped && <span className='text-neutral'> skipped</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

const EvidenceMetricBar: React.FC<{ value: string; label: string; fillPercent: number }> = ({
  value,
  label,
  fillPercent,
}) => {
  const safeFill = Math.max(fillPercent, 0)
  const normalized = Math.min(safeFill / 100, 1)
  const fillOpacity = 0.72 + normalized * 0.28

  return (
    <div className='border-neutral sm:pl-md pb-sm flex h-fit w-full flex-col sm:border-l-2'>
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

const AppraisalDetails: React.FC<{
  appraisal: ValuationAppraisalEvidence
  evidence: ValuationEvidence
  showRawJson: boolean
  onToggleRawJson: () => void
  rawJson: unknown
}> = ({ appraisal, evidence, showRawJson, onToggleRawJson, rawJson }) => {
  const web2 = evidence.web2
  const searchDemand = evidence.searchDemand
  const avgSearches = searchDemand.summary.avgMonthlySearches

  return (
    <div className='border-tertiary bg-tertiary/30 flex flex-col gap-4 rounded-lg border p-4'>
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <EvidenceMetricBar
          value={String(web2.summary.registeredExtensions)}
          label='Web2 extensions'
          fillPercent={toSteppedPercent(web2.summary.registeredExtensions, 500)}
        />
        <EvidenceMetricBar
          value={avgSearches !== null ? avgSearches.toLocaleString() : 'No data'}
          label='Monthly searches'
          fillPercent={toSteppedPercent(avgSearches ?? 0, 1_000_000)}
        />
      </div>

      {appraisal.compsUsed.length > 0 && (
        <div className='flex flex-col gap-2'>
          <p className='text-neutral text-sm font-semibold tracking-wide uppercase'>Similar Sales</p>
          <div className='flex flex-wrap gap-2'>
            {appraisal.compsUsed.map((comp, i) => (
              <div
                key={i}
                className='border-tertiary bg-tertiary/50 flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm'
              >
                <span className='font-medium'>{comp.name}</span>
                <span className='text-neutral'>·</span>
                <span className='text-primary font-semibold'>{comp.priceEth} ETH</span>
                {comp.date && (
                  <>
                    <span className='text-neutral'>·</span>
                    <span className='text-neutral text-xs'>{new Date(comp.date).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
        <EvidenceBulletList
          title='Key signals'
          items={appraisal.signals}
          emptyLabel='No specific evidence points were highlighted.'
        />
        <EvidenceBulletList title='Cautions' items={appraisal.cautions} emptyLabel='No cautions.' />
      </div>

      <button
        type='button'
        className='text-primary w-fit text-sm font-semibold hover:opacity-80'
        onClick={onToggleRawJson}
      >
        {showRawJson ? 'Hide developer JSON' : 'Show developer JSON'}
      </button>
      {showRawJson && (
        <pre className='bg-background/60 border-tertiary max-h-96 overflow-auto rounded-md border p-3 text-xs whitespace-pre-wrap'>
          {JSON.stringify(rawJson, null, 2)}
        </pre>
      )}
    </div>
  )
}

const ValuationEvidencePanel: React.FC<{ name: string }> = ({ name }) => {
  const [showEvidenceDetails, setShowEvidenceDetails] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)
  const { ethPrice } = useETHPrice()

  const {
    generateEvidence,
    valuationEvidence,
    valuationEvidenceError,
    valuationEvidenceProgress,
    valuationEvidenceProgressByStage,
    valuationEvidenceIsLoading,
    valuationEvidenceIsSuccess,
    loginRequired,
  } = useValuationEvidence(name)

  const errorMessage = useMemo(() => {
    if (!valuationEvidenceError) return null
    if (valuationEvidenceError instanceof ValuationEvidenceRequestError) return valuationEvidenceError.message
    return 'Failed to generate valuation evidence'
  }, [valuationEvidenceError])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    generateEvidence({
      recommendationCount: DEFAULT_RECOMMENDATION_COUNT,
      premiumRegistrationFloorEth: DEFAULT_PREMIUM_FLOOR,
    })
  }

  const appraisal = valuationEvidence?.evidence.appraisal
  const toEth = (v: string | undefined) => {
    if (!v) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const valuationScenarios = appraisal
    ? [
        { key: 'bear', label: 'Low estimate', ethValue: toEth(appraisal.lowEth) },
        { key: 'base', label: 'Est. value', ethValue: toEth(appraisal.ethValue) },
        { key: 'bull', label: 'High estimate', ethValue: toEth(appraisal.highEth) },
      ].map((s) => ({ ...s, usdValue: s.ethValue !== null ? s.ethValue * ethPrice : null }))
    : []

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div className='flex flex-col gap-1'>
        <h2 className='font-sedan-sc text-3xl'>GrailsAI Valuation</h2>
        <p className='text-neutral text-sm'>(beta) approximate market value</p>
      </div>

      <form onSubmit={handleSubmit}>
        <button
          type='submit'
          className={cn(
            'bg-primary text-background flex h-10 w-full cursor-pointer items-center justify-center rounded-md px-4 text-sm font-semibold transition hover:opacity-90 active:scale-[0.99]',
            (valuationEvidenceIsLoading || loginRequired) && 'cursor-not-allowed opacity-60'
          )}
          disabled={valuationEvidenceIsLoading || loginRequired}
        >
          {valuationEvidenceIsLoading ? (
            <span className='flex items-center gap-2'>
              <LoadingSpinner size='h-4 w-4' />
              {valuationEvidenceProgress?.label ?? 'Generating valuation'}
            </span>
          ) : valuationEvidenceIsSuccess ? (
            'Refresh valuation'
          ) : (
            'Generate valuation'
          )}
        </button>
      </form>

      {valuationEvidenceIsLoading && <ValuationProgressChecklist progressByStage={valuationEvidenceProgressByStage} />}

      {loginRequired && <p className='text-neutral text-sm'>Sign in to generate valuation evidence.</p>}
      {errorMessage && <p className='text-sm font-medium text-red-400'>{errorMessage}</p>}

      {valuationEvidence && appraisal && (
        <div className='flex flex-col gap-4'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            {valuationScenarios.map((scenario) => (
              <ValuationScenarioCard
                key={scenario.key}
                ethValue={scenario.ethValue}
                usdValue={scenario.usdValue}
                label={scenario.label}
                isPrimary={scenario.key === 'base'}
              />
            ))}
          </div>

          {appraisal.reasoning && <p className='text-neutral text-sm'>{appraisal.reasoning}</p>}

          {appraisal.error && (
            <p className='rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm font-medium text-yellow-200'>
              Final appraisal failed: {appraisal.error.message}
            </p>
          )}

          <button
            type='button'
            className='text-primary w-fit text-sm font-semibold hover:opacity-80'
            onClick={() => setShowEvidenceDetails((isOpen) => !isOpen)}
          >
            {showEvidenceDetails ? 'Hide evidence details' : 'Show evidence details'}
          </button>

          {showEvidenceDetails && (
            <AppraisalDetails
              appraisal={appraisal}
              evidence={valuationEvidence.evidence}
              showRawJson={showRawJson}
              onToggleRawJson={() => setShowRawJson((isOpen) => !isOpen)}
              rawJson={valuationEvidence}
            />
          )}
        </div>
      )}
    </div>
  )
}

export default ValuationEvidencePanel
