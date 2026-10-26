'use client'

import { CostSkeleton } from '@/components/ui/ensSkeletons'
import { SkeletonText } from '@/components/ui/loadingSkeleton'

import { Check } from 'ethereum-identity-kit'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Input from '@/components/ui/input'
import Dropdown from '@/components/ui/dropdown'
import DatePicker from '@/components/ui/datepicker'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import ClaimPoap from '../poap/claimPoap'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import Calendar from 'public/icons/calendar.svg'
import { beautifyName } from '@/lib/ens'
import { config } from '@/lib/config'
import { Address, Hex } from 'viem'
import { registrationAssets, TOKENS } from '@/constants/web3/tokens'
import { timeUnitOptions } from '@/constants/registration'
import { getSecondsPerUnit } from '@/utils/registration'
import type { TimeUnit } from '@/types/registration'
import type { RenewalTransaction } from '@/types/renewal'
import { useRenewalModal } from './hooks/use-renewal-modal'
import RenewalSubject from './components/renewal-subject'
import ProgressView, { getProgressStatus } from './components/progress-view'
import SuccessView, { type RenewalLink } from './components/success-view'
import ErrorView from './components/error-view'
import CancelView, { CancelFooter, ProgressFooter } from './components/cancel-view'
import { getRenewalSteps } from './components/renewal-steps'
import { formatExpiryDate, formatRenewalDuration, getNewExpiry } from './components/renewal-format'

const KEEP_OPEN_HINT = 'Keep this window open until the transaction confirms.'

interface ExtendModalProps {
  onClose: () => void
}

const ExtendModal: React.FC<ExtendModalProps> = ({ onClose }) => {
  const {
    domains,
    poapClaimed,
    quantity,
    setQuantity,
    timeUnit,
    setTimeUnit,
    customDate,
    setCustomDate,
    asset,
    setAsset,
    showDatePicker,
    setShowDatePicker,
    success,
    isLoading,
    error,
    errorDetails,
    quoteError,
    stage,
    transaction,
    entries,
    runBatches,
    runHashes,
    approvalHashes,
    runTotals,
    showCancelWarning,
    setShowCancelWarning,
    handleCancelRenewal,
    handleBackToReview,
    currentNetwork,
    currentBatch,
    totalBatches,
    namesProcessed,
    completedTransactions,
    completedNames,
    remainingDomains,
    longestExpirationDate,
    calculationResults,
    estimatedGasCost,
    hasSufficientBalance,
    hasSufficientEth,
    hasSufficientAssets,
    hasV1,
    hasV2,
    hasDifferentV1Durations,
    hasPendingTransaction,
    isLoadingQuote,
    isLoadingFunds,
    parametersLocked,
    handleSubmit,
    handleClose,
    transactionUrl,
  } = useRenewalModal(onClose)

  if (domains.length === 0) return null

  const title = `Extend Name${domains.length > 1 ? 's' : ''}`
  const isBulk = domains.length > 1
  const tokenLabel = TOKENS[asset]
  const toLink = (tx: RenewalTransaction): RenewalLink => ({
    key: `${tx.version}-${tx.hash}`,
    hash: tx.hash,
    href: transactionUrl(tx),
  })
  const completedLinks = completedTransactions.map(toLink)

  const subject = (
    <RenewalSubject
      domains={domains}
      compact
      transactionCount={runBatches.length || totalBatches}
      durationLabel={formatRenewalDuration(quantity, timeUnit, customDate)}
      totals={runTotals ?? calculationResults}
      tokenLabel={tokenLabel}
      hasV1={hasV1}
      hasV2={hasV2}
    />
  )

  const primaryDisabled =
    isLoading ||
    (!hasPendingTransaction && (!calculationResults || !hasSufficientBalance || remainingDomains.length === 0))
  const primaryLabel = isLoading
    ? totalBatches > 1
      ? `Extending... (${currentBatch}/${totalBatches})`
      : 'Extending...'
    : hasPendingTransaction
      ? 'Check transaction'
      : isLoadingQuote
        ? 'Loading costs...'
        : isLoadingFunds
          ? 'Checking balances...'
          : !calculationResults
            ? 'Select a valid renewal'
            : !hasSufficientBalance
              ? 'Insufficient Balance'
              : error && remainingDomains.length > 0
                ? `Try Again (${remainingDomains.length} name${remainingDomains.length > 1 ? 's' : ''} remaining)`
                : remainingDomains.length === 1
                  ? `Extend ${beautifyName(remainingDomains[0].name)}`
                  : `Extend ${remainingDomains.length} Name${remainingDomains.length > 1 ? 's' : ''}`
  const primaryButton = (
    <PrimaryButton onClick={handleSubmit} disabled={primaryDisabled} className={modalPrimaryActionClassName}>
      {primaryLabel}
    </PrimaryButton>
  )
  const closeButton = (
    <SecondaryButton onClick={handleClose} className={modalActionClassName} disabled={isLoading}>
      Close
    </SecondaryButton>
  )

  // Opened from "Cancel" while the renewal runs; the renewal keeps going behind it.
  if (showCancelWarning) {
    return (
      <ModalShell
        key='extend-modal'
        title='Cancel Renewal'
        onClose={() => setShowCancelWarning(false)}
        stageKey='cancel'
        footer={<CancelFooter onContinue={() => setShowCancelWarning(false)} onCancel={handleCancelRenewal} />}
      >
        <CancelView isBulk={isBulk} namesProcessed={namesProcessed} totalNames={domains.length} />
      </ModalShell>
    )
  }

  if (success && config.canClaimPoap && !poapClaimed) {
    return (
      <ModalShell key='extend-modal' onClose={handleClose} locked stageKey='poap'>
        <ClaimPoap />
      </ModalShell>
    )
  }

  if (isLoading) {
    const statusInput = {
      stage,
      isApprovalPending: stage === 'approving' && !!transaction,
      tokenLabel,
      network: currentNetwork,
      currentBatch,
      totalBatches,
      namesProcessed,
      totalNames: domains.length,
    }
    const steps = getRenewalSteps({
      stage,
      batches: runBatches,
      currentBatch,
      hashes: runHashes,
      approvalHashes,
      tokenLabel,
      href: (hash, version) => transactionUrl({ hash: hash as Hex, version }),
    })

    return (
      <ModalShell
        key='extend-modal'
        title={title}
        onClose={handleClose}
        locked
        subject={subject}
        stageKey='progress'
        footer={<ProgressFooter onCancel={() => setShowCancelWarning(true)} />}
        footerHint={getProgressStatus(statusInput).state === 'wallet' ? undefined : KEEP_OPEN_HINT}
      >
        <ProgressView
          {...statusInput}
          batchNames={runBatches[currentBatch - 1]?.names ?? []}
          isBulk={isBulk}
          steps={steps}
        />
      </ModalShell>
    )
  }

  if (success) {
    const links = completedLinks.length > 0 ? completedLinks : transaction ? [toLink(transaction)] : []

    return (
      <ModalShell
        key='extend-modal'
        title={title}
        onClose={handleClose}
        dismissible={false}
        stageKey='success'
        footer={
          <SecondaryButton onClick={handleClose} className={modalActionClassName}>
            Close
          </SecondaryButton>
        }
      >
        <SuccessView
          domains={domains}
          newExpiry={entries.length === 1 ? getNewExpiry(entries[0].currentExpiry, entries[0].duration) : null}
          links={links}
        />
      </ModalShell>
    )
  }

  if (error) {
    const isUnconfirmed = hasPendingTransaction && !!transaction

    return (
      <ModalShell
        key='extend-modal'
        title={title}
        onClose={handleClose}
        subject={subject}
        stageKey={isUnconfirmed ? 'unconfirmed' : 'error'}
        footer={
          <>
            {parametersLocked || hasPendingTransaction ? (
              primaryButton
            ) : (
              <PrimaryButton onClick={handleBackToReview} className={modalPrimaryActionClassName}>
                Try Again
              </PrimaryButton>
            )}
            {closeButton}
          </>
        }
      >
        <ErrorView
          error={error}
          errorDetails={errorDetails}
          pendingTransaction={isUnconfirmed ? toLink(transaction) : null}
          namesProcessed={namesProcessed}
          totalNames={domains.length}
          remainingCount={remainingDomains.length}
          parametersLocked={parametersLocked}
          completedLinks={completedLinks}
          expiryItems={
            isBulk && entries.length > 0
              ? entries.map((entry) => {
                  const newExpiry = getNewExpiry(entry.currentExpiry, entry.duration)
                  return {
                    name: beautifyName(entry.domain.name),
                    version: entry.version,
                    from: entry.currentExpiry > 0 ? formatExpiryDate(entry.currentExpiry * 1000) : null,
                    to: newExpiry ? formatExpiryDate(newExpiry) : null,
                    done: completedNames.has(entry.domain.name),
                  }
                })
              : null
          }
        />
      </ModalShell>
    )
  }

  return (
    <ModalShell
      key='extend-modal'
      title={title}
      onClose={handleClose}
      stageKey='review'
      dismissible={!showDatePicker}
      className={cn(showDatePicker && 'min-h-120')}
      overlay={
        showDatePicker ? (
          <DatePicker
            onSelect={(timestamp) => {
              setCustomDate(timestamp)
              setShowDatePicker(false)
            }}
            onClose={() => setShowDatePicker(false)}
            className='w-full max-w-sm'
            minDate={new Date(longestExpirationDate * 1000)}
          />
        ) : null
      }
      footer={
        <>
          {primaryButton}
          {closeButton}
        </>
      }
    >
      <div className='flex w-full flex-col gap-2 sm:gap-2'>
        {/* Domain list */}
        <div>
          <div className='bg-secondary border-tertiary max-h-40 overflow-y-auto rounded-lg border p-3'>
            <div className='text-md space-y-1'>
              <div className='text-neutral flex w-full flex-row items-center justify-between gap-1 text-xs sm:text-sm'>
                <p className='w-[40%] sm:w-1/2'>Name</p>
                <div className='flex w-[60%] flex-row items-center justify-between sm:w-1/2'>
                  <p className='w-1/2 text-right'>Old Expiration</p>
                  <p className='w-1/2 text-right'>New Expiration</p>
                </div>
              </div>
              {domains.map((domain, index) => (
                <div key={index} className='flex justify-between'>
                  <span className='flex w-[40%] items-center gap-1 font-semibold sm:w-1/2 sm:max-w-1/2'>
                    <span className='truncate'>{beautifyName(domain.name)}</span>
                    <span className='text-neutral shrink-0 text-xs'>V{domain.version}</span>
                    {completedNames.has(domain.name) && <Check className='h-3 w-3 shrink-0 text-green-400' />}
                  </span>
                  <div className='flex w-[60%] flex-row items-center justify-between sm:w-1/2'>
                    <p className='text-neutral w-1/2 text-right font-medium'>
                      {domain.expiry_date ? new Date(domain.expiry_date).toLocaleDateString() : 'Unknown'}
                    </p>
                    <div className='flex w-1/2 flex-row items-center justify-end'>
                      <p className='text-neutral text-md mx-auto pb-px text-center'>&rarr;</p>
                      <p className='text-right font-medium text-green-500'>
                        {domain.expiry_date
                          ? new Date(
                              timeUnit !== 'custom'
                                ? new Date(domain.expiry_date).getTime() + quantity * getSecondsPerUnit(timeUnit) * 1000
                                : customDate * 1000
                            ).toLocaleDateString()
                          : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <fieldset disabled={parametersLocked} className='flex flex-col gap-2 disabled:opacity-60'>
          <div className='flex w-full flex-row gap-2'>
            <Dropdown
              label='Unit'
              hideLabel={true}
              options={timeUnitOptions}
              value={timeUnit}
              onSelect={(value) => {
                setTimeUnit(value as TimeUnit)
                if (value === 'custom') {
                  setShowDatePicker(true)
                } else {
                  setShowDatePicker(false)
                }
              }}
              className='w-2/5'
            />
            {timeUnit === 'custom' ? (
              <PrimaryButton onClick={() => setShowDatePicker(true)} className='h-12! w-full' disabled={isLoading}>
                {customDate
                  ? new Date(customDate * 1000).toLocaleDateString(navigator.language || 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Select Date'}
              </PrimaryButton>
            ) : (
              <Input
                type='number'
                label='Quantity'
                placeholder='Number'
                min={0}
                hideLabel={true}
                className='w-3/5'
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            )}
          </div>

          <div className='border-tertiary bg-secondary rounded-lg border p-2'>
            <p className='text-md text-neutral'>
              When setting a custom date, you will only be able to select a date after the longest expiration date of
              your domains.
            </p>
          </div>
          <button
            onClick={() => {
              setTimeUnit('custom')
              setShowDatePicker(true)
            }}
            className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
          >
            <p>Select a custom date</p>
            <Image src={Calendar} alt='calendar' width={18} height={18} />
          </button>
          {hasV2 && (
            <Dropdown
              label={hasV1 ? 'V2 currency' : 'Currency'}
              options={registrationAssets}
              value={asset}
              onSelect={(value) => setAsset(value as Address)}
            />
          )}
        </fieldset>
        {hasDifferentV1Durations && (
          <p className='text-neutral text-sm'>
            V1 names with different extension durations require separate transactions.
          </p>
        )}

        <div className='flex flex-col gap-2'>
          {/* Pricing display */}
          {calculationResults && (
            <div className='bg-secondary border-tertiary rounded-lg border p-3'>
              <div className='text-md space-y-2'>
                {hasV1 && (
                  <div className='flex items-center justify-between'>
                    <p>{hasV2 ? 'V1 renewal cost:' : 'Renewal cost:'}</p>
                    <div className='flex flex-col items-end'>
                      <p className='font-medium'>{calculationResults.totalPriceETH.toFixed(6)} ETH</p>
                      <p className='text-neutral text-xs'>(${calculationResults.totalPriceUSD.toFixed(2)})</p>
                    </div>
                  </div>
                )}
                {hasV2 && (
                  <>
                    {!!calculationResults.durationDiscount?.amount && (
                      <div className='flex items-center justify-between gap-2 text-green-400'>
                        <p>{hasV1 ? 'V2 duration discount:' : 'Duration discount:'}</p>
                        <p className='text-right font-medium'>
                          -{calculationResults.durationDiscount.amount.toFixed(2)} {TOKENS[asset]} (
                          {Number(calculationResults.durationDiscount.percentage.toFixed(2))}%)
                        </p>
                      </div>
                    )}
                    <div className='flex items-center justify-between'>
                      <p>{hasV1 ? 'V2 renewal cost:' : 'Renewal cost:'}</p>
                      <p className='font-medium'>
                        {calculationResults.totalPriceAsset.toFixed(2)} {TOKENS[asset]}
                      </p>
                    </div>
                  </>
                )}
                {estimatedGasCost !== null && (
                  <div className='flex justify-between gap-2'>
                    <span>Estimated gas:</span>
                    <span className='text-right font-medium'>~{Number(estimatedGasCost.toFixed(8))} ETH</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isLoadingQuote &&
            (calculationResults ? (
              <SkeletonText label='Updating renewal costs…' className='w-32' />
            ) : (
              <CostSkeleton label='Loading renewal costs…' />
            ))}
          {quoteError && <p className='text-sm text-red-400'>{quoteError}</p>}

          {/* Insufficient balance warning */}
          {calculationResults && !isLoadingFunds && !quoteError && !hasSufficientBalance && !hasPendingTransaction && (
            <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
              <p className='text-md text-red-400'>
                {!hasSufficientEth && `Insufficient ETH on ${currentNetwork} for renewal costs and network fees. `}
                {!hasSufficientAssets && `Insufficient ${TOKENS[asset]} for V2 renewals.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  )
}

export default ExtendModal
