'use client'

import React, { FormEvent, useMemo } from 'react'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import AnimateIn from '@/components/ui/animateIn'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { setShareModalType, setShareModalDomainInfo, setShareModalOpen } from '@/state/reducers/modals/shareModal'
import ShareIconWhite from 'public/icons/image.svg'
import useETHPrice from '@/hooks/useETHPrice'
import { useValuationEvidence } from '../../hooks/useValuationEvidence'
import { ValuationEvidenceRequestError } from '@/api/valuations/generateEvidence'
import ValuationResult from './ValuationResult'
import ValuationProgressChecklist from './ValuationProgressChecklist'

const ValuationRangePanel: React.FC<{ name: string; ownerAddress?: string | null }> = ({ name, ownerAddress }) => {
  const { ethPrice } = useETHPrice()
  const dispatch = useAppDispatch()

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
    generateEvidence()
  }

  const openShareModal = () => {
    dispatch(setShareModalType('valuation'))
    dispatch(
      setShareModalDomainInfo({
        name,
        ownerAddress: ownerAddress ?? null,
        categories: null,
      })
    )
    dispatch(setShareModalOpen(true))
  }

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div className='flex flex-row items-center justify-between gap-2'>
        <div className='flex items-center gap-2'>
          <h2 className='font-sedan-sc text-3xl'>Valuation</h2>
          <span className='bg-foreground/80 text-background rounded px-1.5 py-0.5 text-xs font-bold tracking-wide uppercase'>
            beta
          </span>
        </div>
        <div className='flex flex-row items-center gap-2'>
          {hasResult && (
            <button
              type='button'
              onClick={openShareModal}
              className='flex cursor-pointer items-center justify-center rounded-md p-1 transition-opacity hover:opacity-80'
              aria-label='Share valuation'
            >
              <Image src={ShareIconWhite} width={22} height={22} alt='Share' />
            </button>
          )}
          <span className='text-neutral text-lg'>✨ GrailsAI</span>
        </div>
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
        <AnimateIn>
          <ValuationProgressChecklist progressByStage={valuationEvidenceProgressByStage} />
        </AnimateIn>
      )}

      {loginRequired && !hasResult && !valuationEvidenceIsInitialLoading && (
        <p className='text-neutral text-lg'>Sign in to generate a valuation.</p>
      )}
      {errorMessage && <p className='text-lg font-medium text-red-400'>{errorMessage}</p>}

      {appraisal && valuationEvidence && (
        <AnimateIn>
          <ValuationResult
            name={name}
            appraisal={appraisal}
            evidence={valuationEvidence.evidence}
            ethPrice={ethPrice}
          />
        </AnimateIn>
      )}
    </div>
  )
}

export default ValuationRangePanel
