'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import ModalShell, {
  modalActionClassName,
  modalDangerActionClassName,
  modalPrimaryActionClassName,
} from '@/components/ui/modal/modalShell'
import AssetSummary from '@/components/ui/modal/assetSummary'
import Notice from '@/components/ui/modal/notice'
import DatePicker from '@/components/ui/datepicker'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import { MAX_BATCH_SIZE } from '@/constants/registration'
import { TOKENS } from '@/constants/web3/tokens'
import ClaimPoap from '../poap/claimPoap'
import useRegistrationModal from './hooks/use-registration-modal'
import SuccessView from './components/success-view'
import ErrorView from './components/error-view'
import CommittingView from './components/committing-view'
import WaitingView from './components/waiting-view'
import RegisteringView from './components/registering-view'
import ReviewForm, { ReviewActions } from './components/review-form'
import { getRegistrationSteps } from './components/registration-steps'
import RegistrationToast from './components/registration-toast'
import ResolverSetupView from './components/resolver-setup-view'
import SuccessToast, { type SuccessSummary } from './components/success-toast'
import { useAppDispatch } from '@/state/hooks'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { track } from '@/lib/analytics'
import { config } from '@/lib/config'
import { DAY, MINUTE } from 'ethereum-identity-kit'

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

  const { flowState } = registrationState
  const hasEntries = entries.length > 0 && !!firstDomain
  const isActiveFlow =
    flowState === 'resolver' || flowState === 'committing' || flowState === 'waiting' || flowState === 'registering'
  const showSuccessToast = !!successSummary && !registrationState.isOpen
  const showProgressToast =
    !showSuccessToast && hasEntries && !registrationState.isOpen && (isActiveFlow || flowState === 'error')
  const showModal = !showSuccessToast && hasEntries && registrationState.isOpen

  const currentBatch = modal.currentBatch
  const tokenLabel = TOKENS[modal.asset]
  const expectedBatches = modal.totalBatches || Math.ceil(availableEntries.length / MAX_BATCH_SIZE)
  const steps = getRegistrationSteps({
    flowState,
    batches: modal.batches,
    currentBatchIndex: registrationState.currentBatchIndex,
    isBulk,
    nameCount: availableEntries.length,
    tokenLabel,
    isApproving: modal.isApproving,
    approvalTxHash: modal.approvalTxHash,
    waitTimeRemaining: modal.waitTimeRemaining,
  })

  const renderModal = () => {
    const title = isBulk ? 'Register Names' : 'Register Name'
    const keepOpenHint = 'Keep this window open until the transaction confirms.'
    const cancelButton = (
      <SecondaryButton onClick={() => setShowCancelWarning(true)} className={modalActionClassName}>
        Cancel
      </SecondaryButton>
    )

    if (allAvailabilityChecked && availableEntries.length === 0) {
      return (
        <ModalShell
          key='registration-modal'
          title={isBulk ? 'Names Not Available' : 'Name Not Available'}
          onClose={handleClose}
          stageKey='unavailable'
          footer={
            <SecondaryButton onClick={onResetModal} className={modalActionClassName}>
              Close
            </SecondaryButton>
          }
        >
          <Notice tone='warning'>
            {isBulk ? (
              <>None of the selected names are available for registration.</>
            ) : (
              <>
                The name <span className='font-bold'>{beautifyName(firstName!)}</span> is not available for
                registration.
              </>
            )}
          </Notice>
        </ModalShell>
      )
    }

    if (showCancelWarning) {
      return (
        <ModalShell
          key='registration-modal'
          title='Cancel Registration'
          onClose={() => setShowCancelWarning(false)}
          stageKey='cancel'
          footer={
            <>
              <SecondaryButton onClick={() => setShowCancelWarning(false)} className={modalActionClassName}>
                Continue
              </SecondaryButton>
              <SecondaryButton
                onClick={() => {
                  onResetModal()
                  setShowCancelWarning(false)
                }}
                className={modalDangerActionClassName}
              >
                Cancel Registration
              </SecondaryButton>
            </>
          }
        >
          <Notice tone='warning' title='Cancel Registration?'>
            Are you sure you want to cancel this registration? You will lose your commitment and have to start over.
          </Notice>
        </ModalShell>
      )
    }

    if (flowState === 'success' && config.canClaimPoap && !poapClaimed && !isBulk) {
      return (
        <ModalShell key='registration-modal' onClose={handleClose} locked stageKey='poap'>
          <ClaimPoap />
        </ModalShell>
      )
    }

    const compact = isActiveFlow || flowState === 'error'
    const subject = isBulk ? (
      <AssetSummary
        name={`${availableEntries.length} names`}
        compact={compact}
        stack={availableEntries.slice(0, 3).map((entry) => (
          <NameImage
            key={entry.name}
            name={entry.name}
            tokenId={entry.domain.token_id}
            version={entry.domain.version}
            expiryDate={entry.domain.expiry_date}
            className='h-full w-full object-cover'
            height={compact ? 40 : 48}
            width={compact ? 40 : 48}
          />
        ))}
        meta={`${expectedBatches * 2} transactions`}
        price={
          modal.calculationResults ? (
            <p className='text-xl font-bold'>
              {modal.calculationResults.priceUSD.toFixed(2)} {tokenLabel}
            </p>
          ) : undefined
        }
      />
    ) : (
      <AssetSummary
        name={beautifyName(firstName!)}
        compact={isActiveFlow || flowState === 'error'}
        image={
          <NameImage
            name={firstName!}
            tokenId={firstDomain.token_id}
            version={firstDomain.version}
            expiryDate={firstDomain.expiry_date}
            className='h-full w-full'
            height={48}
            width={48}
          />
        }
        meta={entries[0]?.isAvailable === null ? 'Checking availability...' : 'Available'}
        price={
          modal.calculationResults ? (
            <p className='text-xl font-bold'>
              {modal.calculationResults.priceUSD.toFixed(2)} {tokenLabel}
            </p>
          ) : undefined
        }
      />
    )

    if (flowState === 'success') {
      const closeSuccess = () => {
        onResetModal()
        dispatch(clearBulkSelect())
      }

      return (
        <ModalShell
          key='registration-modal'
          title={title}
          onClose={handleClose}
          stageKey='success'
          footer={
            <SecondaryButton onClick={closeSuccess} className={modalActionClassName}>
              Close
            </SecondaryButton>
          }
        >
          <SuccessView
            isBulk={isBulk}
            firstName={firstName}
            firstDomain={firstDomain}
            availableEntries={availableEntries}
            batches={modal.batches}
            totalBatches={modal.totalBatches}
            calculationResults={modal.calculationResults}
            onClose={closeSuccess}
          />
        </ModalShell>
      )
    }

    if (flowState === 'error') {
      return (
        <ModalShell
          key='registration-modal'
          title={title}
          onClose={handleClose}
          subject={subject}
          stageKey='error'
          footer={
            <>
              <PrimaryButton onClick={modal.onRetry} className={modalPrimaryActionClassName}>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className={modalActionClassName}>
                Close
              </SecondaryButton>
            </>
          }
        >
          <ErrorView errorMessage={registrationState.errorMessage} />
        </ModalShell>
      )
    }

    if (flowState === 'resolver') {
      const isDeploying = modal.isDeployingResolver || !!registrationState.resolverDeploymentTxHash

      return (
        <ModalShell
          key='registration-modal'
          title={title}
          onClose={handleClose}
          onMinimize={handleClose}
          subject={subject}
          stageKey={isDeploying ? 'resolver-deploying' : 'resolver'}
          footer={
            isDeploying ? undefined : (
              <>
                <PrimaryButton onClick={modal.handleDeployResolver} className={modalPrimaryActionClassName}>
                  Deploy resolver
                </PrimaryButton>
                <SecondaryButton onClick={modal.handleSkipResolver} className={modalActionClassName}>
                  Skip for now
                </SecondaryButton>
                <button
                  type='button'
                  onClick={modal.handleResolverBack}
                  className='text-neutral hover:text-foreground mx-auto cursor-pointer px-3 py-1 text-lg font-semibold transition-colors'
                >
                  Back
                </button>
              </>
            )
          }
          footerHint={isDeploying && registrationState.resolverDeploymentTxHash ? keepOpenHint : undefined}
        >
          <ResolverSetupView isDeploying={isDeploying} txHash={registrationState.resolverDeploymentTxHash ?? null} />
        </ModalShell>
      )
    }

    if (flowState === 'committing') {
      return (
        <ModalShell
          key='registration-modal'
          title={title}
          onClose={handleClose}
          onMinimize={handleClose}
          subject={subject}
          stageKey='committing'
          footer={cancelButton}
          footerHint={currentBatch?.commitTxHash ? keepOpenHint : undefined}
        >
          <CommittingView
            totalBatches={modal.totalBatches}
            currentBatchIndex={registrationState.currentBatchIndex}
            currentBatch={currentBatch}
            availableEntries={availableEntries}
            isBulk={isBulk}
            steps={steps}
          />
        </ModalShell>
      )
    }

    if (flowState === 'waiting') {
      return (
        <ModalShell
          key='registration-modal'
          title={title}
          onClose={handleClose}
          onMinimize={handleClose}
          subject={subject}
          stageKey='waiting'
          footer={
            <>
              <PrimaryButton
                onClick={modal.handleRegister}
                disabled={modal.waitTimeRemaining > 0}
                className={modalPrimaryActionClassName}
              >
                {modal.waitTimeRemaining > 0 ? `Wait ${modal.waitTimeRemaining} seconds...` : 'Complete Registration'}
              </PrimaryButton>
              {cancelButton}
            </>
          }
        >
          <WaitingView
            waitTimeRemaining={modal.waitTimeRemaining}
            isBulk={isBulk}
            firstName={firstName}
            availableEntries={availableEntries}
            steps={steps}
          />
        </ModalShell>
      )
    }

    if (flowState === 'registering') {
      const txHash = modal.isApproving ? modal.approvalTxHash : currentBatch?.registerTxHash

      return (
        <ModalShell
          key='registration-modal'
          title={title}
          onClose={handleClose}
          onMinimize={handleClose}
          subject={subject}
          stageKey='registering'
          footer={cancelButton}
          footerHint={txHash ? keepOpenHint : undefined}
        >
          <RegisteringView
            isApproving={modal.isApproving}
            approvalTxHash={modal.approvalTxHash}
            totalBatches={modal.totalBatches}
            currentBatchIndex={registrationState.currentBatchIndex}
            currentBatch={currentBatch}
            availableEntries={availableEntries}
            isBulk={isBulk}
            steps={steps}
          />
        </ModalShell>
      )
    }

    // Minimum allowed registration period is 28 days (additional 30 minutes so that
    // by the time registration goes through the time does not fall below 28 days)
    const minRegDate = new Date().getTime() + 28 * DAY + 30 * MINUTE
    const datePicker = showDatePicker ? (
      <DatePicker
        onSelect={modal.onCustomDateSelect}
        minDate={new Date(minRegDate)}
        onClose={() => modal.setShowDatePicker(false)}
        className='w-full max-w-sm'
      />
    ) : perNameDatePickerIndex !== null ? (
      <DatePicker
        onSelect={modal.onEntryDateSelect}
        minDate={new Date(minRegDate)}
        onClose={() => modal.setPerNameDatePickerIndex(null)}
        className='w-full max-w-sm'
      />
    ) : null

    return (
      <ModalShell
        key='registration-modal'
        title={title}
        onClose={handleClose}
        subject={subject}
        stageKey='review'
        dismissible={!datePicker}
        overlay={datePicker}
        className={cn(datePicker && 'min-h-120')}
        footer={
          <ReviewActions
            isBulk={isBulk}
            firstName={firstName}
            availableEntries={availableEntries}
            registrationMode={modal.registrationMode}
            customDuration={modal.customDuration}
            allDurationsValid={modal.allDurationsValid}
            resolver={modal.resolver}
            resolverError={modal.resolverError}
            isCheckingResolver={modal.isCheckingResolver}
            calculationResults={modal.calculationResults}
            hasSufficientBalance={modal.hasSufficientBalance}
            allNamesValid={modal.allNamesValid}
            allAvailabilityChecked={allAvailabilityChecked}
            handleCommit={modal.handleCommit}
            handleClose={handleClose}
          />
        }
      >
        <ReviewForm
          isBulk={isBulk}
          entries={entries}
          availableEntries={availableEntries}
          unavailableEntries={unavailableEntries}
          registrationMode={modal.registrationMode}
          timeUnit={modal.timeUnit}
          quantity={modal.quantity}
          customDuration={modal.customDuration}
          entryDurations={modal.entryDurations}
          asset={modal.asset}
          setAsset={modal.setAsset}
          setShowDatePicker={modal.setShowDatePicker}
          setPerNameDatePickerIndex={modal.setPerNameDatePickerIndex}
          perNamePrices={modal.perNamePrices}
          showCustomOwner={modal.showCustomOwner}
          setShowCustomOwner={modal.setShowCustomOwner}
          customOwner={modal.customOwner}
          setCustomOwner={modal.setCustomOwner}
          account={modal.account}
          isResolving={modal.isResolving}
          resolver={modal.resolver}
          setResolver={modal.setResolver}
          resolverError={modal.resolverError}
          isCheckingResolver={modal.isCheckingResolver}
          hasRegistrationParameters={modal.hasRegistrationParameters}
          calculationResults={modal.calculationResults}
          hasSufficientBalance={modal.hasSufficientBalance}
          allNamesValid={modal.allNamesValid}
          gasEstimate={modal.gasEstimate}
          gasPrice={modal.gasPrice}
          totalBatches={expectedBatches}
          onTimeUnitChange={modal.onTimeUnitChange}
          onQuantityChange={modal.onQuantityChange}
          onSelectCustomDate={modal.onSelectCustomDate}
          onEntryDurationChange={modal.onEntryDurationChange}
          onEntryQuantityChange={modal.onEntryQuantityChange}
          onEntryDurationReset={modal.onEntryDurationReset}
        />
      </ModalShell>
    )
  }

  const renderToast = () => {
    if (showSuccessToast && successSummary) {
      return (
        <SuccessToast
          key='success-toast'
          summary={successSummary}
          onClose={() => {
            setSuccessSummary(null)
            onResetModal()
          }}
        />
      )
    }

    if (!showProgressToast) return null

    const hasTxHash = !!(
      (flowState === 'resolver' && registrationState.resolverDeploymentTxHash) ||
      (flowState === 'committing' && currentBatch?.commitTxHash) ||
      (flowState === 'registering' && (modal.isApproving ? modal.approvalTxHash : currentBatch?.registerTxHash))
    )

    return (
      <RegistrationToast
        key='progress-toast'
        flowState={flowState}
        isApproving={modal.isApproving}
        isDeployingResolver={modal.isDeployingResolver}
        waitTimeRemaining={modal.waitTimeRemaining}
        currentBatchIndex={registrationState.currentBatchIndex}
        totalBatches={modal.totalBatches}
        hasTxHash={hasTxHash}
        onClick={handleReopen}
      />
    )
  }

  return (
    <>
      <AnimatePresence>{showModal && renderModal()}</AnimatePresence>
      <AnimatePresence>{renderToast()}</AnimatePresence>
    </>
  )
}

export default RegistrationModal
