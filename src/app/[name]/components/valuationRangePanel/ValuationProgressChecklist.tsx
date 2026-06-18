import React from 'react'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { cn } from '@/utils/tailwind'
import {
  VALUATION_PROGRESS_STAGE_LABELS,
  VALUATION_PROGRESS_STAGES,
  type ValuationEvidenceStreamStageEvent,
  type ValuationProgressStage,
} from '@/types/valuation'

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

export default ValuationProgressChecklist
