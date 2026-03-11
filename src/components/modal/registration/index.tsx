'use client'

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

const RegistrationModal: React.FC = () => {
  const modal = useRegistrationModal()

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
    onResetModal,
  } = modal

  if (!registrationState.isOpen || entries.length === 0 || !firstDomain || !isClient) return null

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
      <ModalBackdrop onClose={handleClose}>
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

  const preventClose =
    registrationState.flowState === 'waiting' ||
    registrationState.flowState === 'committing' ||
    registrationState.flowState === 'registering'

  return (
    <ModalBackdrop
      onClose={handleClose}
      preventClose={preventClose}
      className={cn((showDatePicker || perNameDatePickerIndex !== null) && 'min-h-[480px]')}
    >
      <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
        <h2 className='font-sedan-sc text-center text-3xl'>{isBulk ? 'Register Names' : 'Register Name'}</h2>
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
          onClose={handleClose}
        />
      ) : registrationState.flowState === 'error' ? (
        <ErrorView errorMessage={registrationState.errorMessage} onRetry={modal.onRetry} onClose={handleClose} />
      ) : registrationState.flowState === 'committing' ? (
        <CommittingView
          totalBatches={modal.totalBatches}
          currentBatchIndex={registrationState.currentBatchIndex}
          currentBatch={modal.currentBatch}
          availableEntries={availableEntries}
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
