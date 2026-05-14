'use client'

import { useEffect, useRef, useState } from 'react'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import { CAN_CLAIM_POAP } from '@/constants'
import ClaimPoap from '../poap/claimPoap'
import useRegistrationModal from './hooks/use-registration-modal'
import ModalBackdrop from './components/modal-backdrop'
import SuccessView from './components/success-view'
import ErrorView from './components/error-view'
import CommittingView from './components/committing-view'
import WaitingView from './components/waiting-view'
import RegisteringView from './components/registering-view'
import ReviewForm from './components/review-form'
import RegistrationToast from './components/registration-toast'
import SuccessToast, { type SuccessSummary } from './components/success-toast'
import { useAppDispatch } from '@/state/hooks'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { track } from '@/lib/analytics'

const RegistrationModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const modal = useRegistrationModal()
  const [successSummary, setSuccessSummary] = useState<SuccessSummary | null>(null)
  const hasTrackedSuccess = useRef(false)
  const hasTrackedStart = useRef(false)
  const hasTrackedFailure = useRef(false)

  const {
    isClient,
    registrationState,
    poapClaimed,
    entries,
    isBulk,
    firstName,
    firstDomain,
    allAvailabilityChecked,
    availableEntries,
    unavailableEntries,
    showDatePicker,
    perNameDatePickerIndex,
    showCancelWarning,
    setShowCancelWarning,
    handleClose,
    handleReopen,
    onResetModal,
  } = modal

  // Clear stale success summary when a new registration opens
  useEffect(() => {
    if (registrationState.isOpen && registrationState.flowState === 'review') {
      setSuccessSummary(null)
      hasTrackedSuccess.current = false
      hasTrackedStart.current = false
      hasTrackedFailure.current = false
    }
  }, [registrationState.isOpen, registrationState.flowState])

  useEffect(() => {
    if (registrationState.flowState === 'committing' && !hasTrackedStart.current) {
      hasTrackedStart.current = true
      track('bulk_register_started', {
        domain_count: modal.availableEntries.length,
        is_bulk: modal.isBulk,
        total_batches: modal.totalBatches,
        total_eth: modal.calculationResults?.priceETH ?? null,
        total_usd: modal.calculationResults?.priceUSD ?? null,
      })
    }

    if (registrationState.flowState === 'success' && !hasTrackedSuccess.current) {
      hasTrackedSuccess.current = true
      const firstBatch = registrationState.batches[0]
      const entryDurations = modal.availableEntries.map(
        (entry) => modal.entryDurations[modal.entries.indexOf(entry)] ?? 0
      )
      const nameLengths = modal.availableEntries.map((entry) => entry.name.replace(/\.eth$/, '').length)
      const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
      track('bulk_register_completed', {
        domain_count: modal.availableEntries.length,
        is_bulk: modal.isBulk,
        total_batches: modal.totalBatches,
        total_eth: modal.calculationResults?.priceETH ?? null,
        total_usd: modal.calculationResults?.priceUSD ?? null,
        commit_tx_hash: firstBatch?.commitTxHash ?? null,
        register_tx_hash: firstBatch?.registerTxHash ?? null,
        entry_durations: entryDurations,
        name_lengths: nameLengths,
        avg_duration_seconds: entryDurations.length ? sum(entryDurations) / entryDurations.length : 0,
        avg_name_length: nameLengths.length ? sum(nameLengths) / nameLengths.length : 0,
        min_name_length: nameLengths.length ? Math.min(...nameLengths) : 0,
        max_name_length: nameLengths.length ? Math.max(...nameLengths) : 0,
      })
    }

    if (registrationState.flowState === 'error' && !hasTrackedFailure.current) {
      hasTrackedFailure.current = true
      const lastAttemptedBatch = registrationState.batches[registrationState.currentBatchIndex]
      track('bulk_register_failed', {
        domain_count: modal.availableEntries.length,
        is_bulk: modal.isBulk,
        error_message: registrationState.errorMessage ?? null,
        current_batch_index: registrationState.currentBatchIndex,
        total_batches: modal.totalBatches,
        commit_tx_hash: lastAttemptedBatch?.commitTxHash ?? null,
        register_tx_hash: lastAttemptedBatch?.registerTxHash ?? null,
      })
    }
  }, [
    registrationState.flowState,
    registrationState.batches,
    registrationState.currentBatchIndex,
    registrationState.errorMessage,
    modal.availableEntries,
    modal.entries,
    modal.entryDurations,
    modal.isBulk,
    modal.totalBatches,
    modal.calculationResults,
  ])

  // Detect success while minimized → snapshot data into toast, then reset
  useEffect(() => {
    if (registrationState.flowState === 'success' && !registrationState.isOpen && entries.length > 0) {
      setSuccessSummary({
        entries: availableEntries.map((entry) => ({
          name: beautifyName(entry.name),
          durationSeconds: modal.entryDurations[entries.indexOf(entry)] ?? 0,
        })),
        priceETH: modal.calculationResults?.priceETH ?? 0,
        priceUSD: modal.calculationResults?.priceUSD ?? 0,
      })
      dispatch(clearBulkSelect())
    }
  }, [
    registrationState.flowState,
    registrationState.isOpen,
    entries,
    availableEntries,
    modal.entryDurations,
    modal.calculationResults,
    dispatch,
  ])

  if (!isClient) return null

  if (successSummary && !registrationState.isOpen) {
    return (
      <SuccessToast
        summary={successSummary}
        onClose={() => {
          setSuccessSummary(null)
          onResetModal()
        }}
      />
    )
  }

  if (entries.length === 0 || !firstDomain) return null

  const isActiveFlow =
    registrationState.flowState === 'committing' ||
    registrationState.flowState === 'waiting' ||
    registrationState.flowState === 'registering'

  // Show toast when minimized during active flow or error
  const showMinimizedToast = isActiveFlow || registrationState.flowState === 'error'
  if (!registrationState.isOpen && showMinimizedToast) {
    const currentBatch = modal.currentBatch
    const hasTxHash = !!(
      (registrationState.flowState === 'committing' && currentBatch?.commitTxHash) ||
      (registrationState.flowState === 'registering' && currentBatch?.registerTxHash)
    )
    return (
      <RegistrationToast
        flowState={registrationState.flowState}
        waitTimeRemaining={modal.waitTimeRemaining}
        currentBatchIndex={registrationState.currentBatchIndex}
        totalBatches={modal.totalBatches}
        hasTxHash={hasTxHash}
        onClick={handleReopen}
      />
    )
  }

  if (!registrationState.isOpen) return null

  if (allAvailabilityChecked && availableEntries.length === 0) {
    return (
      <ModalBackdrop onClose={handleClose}>
        <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
          <h2 className='font-sedan-sc text-center text-3xl'>
            {isBulk ? 'Names Not Available' : 'Name Not Available'}
          </h2>
        </div>
        <div className='flex flex-col items-center gap-4 py-8'>
          <p className='text-center text-lg'>
            {isBulk ? (
              <>None of the selected names are available for registration.</>
            ) : (
              <>
                The name <span className='font-bold'>{beautifyName(firstName!)}</span> is not available for
                registration.
              </>
            )}
          </p>
        </div>
        <SecondaryButton onClick={onResetModal} className='w-full'>
          Close
        </SecondaryButton>
      </ModalBackdrop>
    )
  }

  if (showCancelWarning) {
    return (
      <ModalBackdrop onClose={() => setShowCancelWarning(false)}>
        <h2 className='font-sedan-sc text-center text-3xl'>Cancel Registration</h2>
        <p className='text-center font-medium'>
          Are you sure you want to cancel this registration? You will lose your commitment and have to start over.
        </p>
        <div className='flex flex-col items-center gap-2'>
          <SecondaryButton onClick={() => setShowCancelWarning(false)} className='w-full'>
            Continue
          </SecondaryButton>
          <SecondaryButton
            onClick={() => {
              onResetModal()
              setShowCancelWarning(false)
            }}
            className='w-full bg-red-500!'
          >
            Cancel Registration
          </SecondaryButton>
        </div>
      </ModalBackdrop>
    )
  }

  if (registrationState.flowState === 'success' && CAN_CLAIM_POAP && !poapClaimed && !isBulk) {
    return (
      <ModalBackdrop preventClose>
        <ClaimPoap />
      </ModalBackdrop>
    )
  }

  return (
    <ModalBackdrop
      onClose={handleClose}
      className={cn((showDatePicker || perNameDatePickerIndex !== null) && 'min-h-[480px]')}
    >
      <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
        <h2 className='font-sedan-sc text-center text-3xl'>{isBulk ? 'Register Names' : 'Register Name'}</h2>
        {isActiveFlow && (
          <button
            onClick={handleClose}
            className='text-neutral hover:text-foreground absolute top-2 right-4 cursor-pointer transition-colors'
            aria-label='Minimize'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='6' y1='18' x2='19' y2='18' />
            </svg>
          </button>
        )}
      </div>

      {registrationState.flowState === 'review' && (
        <>
          {!isBulk && (
            <div className='flex items-center justify-between gap-2'>
              <p className='font-sedan-sc text-center text-2xl'>Name</p>
              <p className='text-center text-xl font-bold'>{beautifyName(firstName!)}</p>
            </div>
          )}
          {unavailableEntries.length > 0 && (
            <div className='rounded-lg border border-amber-500/20 bg-amber-900/20 p-3'>
              <p className='text-md text-amber-400'>
                {unavailableEntries.length} name{unavailableEntries.length > 1 ? 's are' : ' is'} not available and will
                be excluded: {unavailableEntries.map((e) => beautifyName(e.name)).join(', ')}
              </p>
            </div>
          )}
        </>
      )}

      {registrationState.flowState === 'success' ? (
        <SuccessView
          isBulk={isBulk}
          firstName={firstName}
          firstDomain={firstDomain}
          availableEntries={availableEntries}
          batches={modal.batches}
          totalBatches={modal.totalBatches}
          calculationResults={modal.calculationResults}
          onClose={() => {
            onResetModal()
            dispatch(clearBulkSelect())
          }}
        />
      ) : registrationState.flowState === 'error' ? (
        <ErrorView errorMessage={registrationState.errorMessage} onRetry={modal.onRetry} onClose={handleClose} />
      ) : registrationState.flowState === 'committing' ? (
        <CommittingView
          totalBatches={modal.totalBatches}
          currentBatchIndex={registrationState.currentBatchIndex}
          currentBatch={modal.currentBatch}
          availableEntries={availableEntries}
          isBulk={isBulk}
          onCancel={() => setShowCancelWarning(true)}
        />
      ) : registrationState.flowState === 'waiting' ? (
        <WaitingView
          waitTimeRemaining={modal.waitTimeRemaining}
          isBulk={isBulk}
          firstName={firstName}
          availableEntries={availableEntries}
          batches={modal.batches}
          totalBatches={modal.totalBatches}
          onRegister={modal.handleRegister}
          onCancel={() => setShowCancelWarning(true)}
        />
      ) : registrationState.flowState === 'registering' ? (
        <RegisteringView
          totalBatches={modal.totalBatches}
          currentBatchIndex={registrationState.currentBatchIndex}
          currentBatch={modal.currentBatch}
          availableEntries={availableEntries}
          isBulk={isBulk}
          onCancel={() => setShowCancelWarning(true)}
        />
      ) : (
        <ReviewForm
          isBulk={isBulk}
          firstName={firstName}
          entries={entries}
          availableEntries={availableEntries}
          registrationMode={modal.registrationMode}
          timeUnit={modal.timeUnit}
          quantity={modal.quantity}
          customDuration={modal.customDuration}
          entryDurations={modal.entryDurations}
          allDurationsValid={modal.allDurationsValid}
          showDatePicker={showDatePicker}
          setShowDatePicker={modal.setShowDatePicker}
          perNameDatePickerIndex={perNameDatePickerIndex}
          setPerNameDatePickerIndex={modal.setPerNameDatePickerIndex}
          showPerNameDurations={modal.showPerNameDurations}
          setShowPerNameDurations={modal.setShowPerNameDurations}
          perNamePrices={modal.perNamePrices}
          showCustomOwner={modal.showCustomOwner}
          setShowCustomOwner={modal.setShowCustomOwner}
          customOwner={modal.customOwner}
          setCustomOwner={modal.setCustomOwner}
          debouncedCustomOwner={modal.debouncedCustomOwner}
          account={modal.account}
          isResolving={modal.isResolving}
          reverseRecord={modal.reverseRecord}
          setReverseRecord={modal.setReverseRecord}
          calculationResults={modal.calculationResults}
          hasSufficientBalance={modal.hasSufficientBalance}
          allNamesValid={modal.allNamesValid}
          allAvailabilityChecked={allAvailabilityChecked}
          totalBatches={modal.totalBatches}
          gasEstimate={modal.gasEstimate}
          gasPrice={modal.gasPrice}
          onTimeUnitChange={modal.onTimeUnitChange}
          onQuantityChange={modal.onQuantityChange}
          onCustomDateSelect={modal.onCustomDateSelect}
          onSelectCustomDate={modal.onSelectCustomDate}
          onEntryDurationChange={modal.onEntryDurationChange}
          onEntryQuantityChange={modal.onEntryQuantityChange}
          onEntryDateSelect={modal.onEntryDateSelect}
          handleCommit={modal.handleCommit}
          handleClose={handleClose}
        />
      )}
    </ModalBackdrop>
  )
}

export default RegistrationModal
