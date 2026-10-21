'use client'

import { Check } from 'ethereum-identity-kit'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Input from '@/components/ui/input'
import Dropdown from '@/components/ui/dropdown'
import DatePicker from '@/components/ui/datepicker'
import ClaimPoap from '../poap/claimPoap'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import Calendar from 'public/icons/calendar.svg'
import { beautifyName } from '@/lib/ens'
import { config } from '@/lib/config'
import { Address } from 'viem'
import { registrationAssets, TOKENS } from '@/constants/web3/tokens'
import { timeUnitOptions } from '@/constants/registration'
import { getSecondsPerUnit } from '@/utils/registration'
import type { TimeUnit } from '@/types/registration'
import { useRenewalModal } from './hooks/use-renewal-modal'

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
    quoteError,
    stage,
    transaction,
    currentNetwork,
    currentBatch,
    totalBatches,
    namesProcessed,
    completedTransactions,
    completedNames,
    remainingDomains,
    longestExpirationDate,
    calculationResults,
    gasCosts,
    insufficientNetworks,
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

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (success || isLoading) return
        handleClose()
      }}
      className='fixed inset-0 z-50 flex h-dvh w-screen items-end justify-end bg-black/40 backdrop-blur-sm md:items-center md:justify-center md:p-4'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className={cn(
          'border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t transition-all duration-300 sm:gap-4 md:max-w-md md:rounded-md md:border-2 starting:translate-y-full md:starting:translate-y-0',
          showDatePicker && 'min-h-120'
        )}
      >
        {success && config.canClaimPoap && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
              <h2 className='font-sedan-sc text-center text-3xl'>Extend Name{domains.length > 1 ? 's' : ''}</h2>
            </div>

            {success ? (
              <div className='flex flex-col items-center gap-4 py-2'>
                <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-3'>
                  <Check className='text-background h-8 w-8' />
                </div>
                <div className='flex flex-col items-center gap-2 text-center'>
                  <h3 className='mb-2 text-xl font-bold'>Extended Names Successfully!</h3>
                  {completedTransactions.length > 0 ? (
                    <div className='flex flex-col gap-1'>
                      {completedTransactions.length > 1 && (
                        <p className='text-neutral mb-1 text-sm'>
                          {completedTransactions.length} transactions completed
                        </p>
                      )}
                      {completedTransactions.map((transaction, index) => (
                        <a
                          key={`${transaction.version}-${transaction.hash}`}
                          href={transactionUrl(transaction)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                        >
                          {completedTransactions.length > 1
                            ? `View Transaction ${index + 1} on Etherscan`
                            : 'View on Etherscan'}
                        </a>
                      ))}
                    </div>
                  ) : transaction ? (
                    <a
                      href={transactionUrl(transaction)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                    >
                      View on Etherscan
                    </a>
                  ) : null}
                </div>
              </div>
            ) : isLoading ? (
              <div className='flex w-full flex-col gap-4'>
                <h2 className='mt-4 text-center text-xl font-bold'>
                  {stage === 'approving'
                    ? `Approve ${TOKENS[asset]}`
                    : stage === 'confirming'
                      ? 'Confirm renewal'
                      : 'Confirming renewal'}
                  {totalBatches > 1 ? ` (${currentBatch} of ${totalBatches})` : ''}
                </h2>
                <div className='flex flex-col items-center justify-center gap-4 pt-4 pb-4 text-center'>
                  <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
                  <div className='flex flex-col gap-2'>
                    <p className='text-neutral text-sm'>{currentNetwork}</p>
                    <p className='text-neutral text-lg'>
                      Extending {namesProcessed}/{domains.length} names...
                    </p>
                    {totalBatches > 1 && (
                      <p className='text-neutral text-sm'>
                        Batch {currentBatch} of {totalBatches}
                      </p>
                    )}
                  </div>
                  {transaction && (
                    <a
                      href={transactionUrl(transaction)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                    >
                      View Transaction {currentBatch} on Etherscan
                    </a>
                  )}
                  {completedTransactions.length > 0 && (
                    <div className='flex flex-col gap-1'>
                      <p className='text-neutral text-sm'>Completed transactions:</p>
                      {completedTransactions.map((transaction, index) => (
                        <a
                          key={`${transaction.version}-${transaction.hash}`}
                          href={transactionUrl(transaction)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary/70 hover:text-primary text-sm underline transition-colors'
                        >
                          Transaction {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
                                        ? new Date(domain.expiry_date).getTime() +
                                            quantity * getSecondsPerUnit(timeUnit) * 1000
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
                      <PrimaryButton
                        onClick={() => setShowDatePicker(true)}
                        className='h-12! w-full'
                        disabled={isLoading}
                      >
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
                    {showDatePicker && (
                      <div className='absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-6 backdrop-blur-sm'>
                        <DatePicker
                          onSelect={(timestamp) => {
                            setCustomDate(timestamp)
                            setShowDatePicker(false)
                          }}
                          onClose={() => setShowDatePicker(false)}
                          className='w-full max-w-sm'
                          minDate={new Date(longestExpirationDate * 1000)}
                        />
                      </div>
                    )}
                  </div>

                  <div className='border-tertiary bg-secondary rounded-lg border p-2'>
                    <p className='text-md text-neutral'>
                      When setting a custom date, you will only be able to select a date after the longest expiration
                      date of your domains.
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
                {parametersLocked && (
                  <p className='text-neutral text-sm'>Duration and currency are fixed while retrying this renewal.</p>
                )}
                {hasDifferentV1Durations && (
                  <p className='text-neutral text-sm'>
                    V1 names with different extension durations require separate transactions.
                  </p>
                )}

                <div className='flex flex-col gap-2'>
                  {/* Pricing display */}
                  {calculationResults && (
                    <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                      {/* <h3 className='mb-2 text-lg font-medium'>Cost Breakdown</h3> */}
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
                        {gasCosts.map(({ chainId, name, amount }) =>
                          amount !== null ? (
                            <div key={chainId} className='flex justify-between gap-2'>
                              <span>{gasCosts.length > 1 ? `${name} gas (est.):` : 'Estimated gas:'}</span>
                              <span className='text-right font-medium'>~{Number(amount.toFixed(8))} ETH</span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                  {isLoadingQuote && <p className='text-neutral text-sm'>Loading renewal costs...</p>}
                  {quoteError && <p className='text-sm text-red-400'>{quoteError}</p>}
                  {/* Error display */}
                  {error && (
                    <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                      <p className='text-sm text-red-400'>{error}</p>
                      {hasPendingTransaction && transaction && (
                        <a
                          href={transactionUrl(transaction)}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary mt-2 block text-sm underline'
                        >
                          View pending transaction
                        </a>
                      )}
                      {namesProcessed > 0 && (
                        <p className='mt-2 text-sm text-yellow-400'>
                          {namesProcessed} of {domains.length} names were successfully extended.
                          {remainingDomains.length > 0 && ` ${remainingDomains.length} names remaining.`}
                        </p>
                      )}
                      {completedTransactions.length > 0 && (
                        <div className='mt-2 flex flex-col gap-1'>
                          <p className='text-neutral text-xs'>Completed transactions:</p>
                          {completedTransactions.map((transaction, index) => (
                            <a
                              key={`${transaction.version}-${transaction.hash}`}
                              href={transactionUrl(transaction)}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary/70 hover:text-primary text-xs underline transition-colors'
                            >
                              Transaction {index + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Insufficient balance warning */}
                  {calculationResults &&
                    !isLoadingFunds &&
                    !quoteError &&
                    !hasSufficientBalance &&
                    !hasPendingTransaction && (
                      <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                        <p className='text-md text-red-400'>
                          {!hasSufficientEth &&
                            `Insufficient ETH on ${insufficientNetworks.join(' and ')} for renewal costs and network fees. `}
                          {!hasSufficientAssets && `Insufficient ${TOKENS[asset]} for V2 renewals.`}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            )}
            {/* Action buttons */}
            <div className='flex flex-col gap-2'>
              {!success && (
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={
                    isLoading ||
                    (!hasPendingTransaction &&
                      (!calculationResults || !hasSufficientBalance || remainingDomains.length === 0))
                  }
                  className='w-full'
                >
                  {isLoading
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
                                  : `Extend ${remainingDomains.length} Name${remainingDomains.length > 1 ? 's' : ''}`}
                </PrimaryButton>
              )}
              <SecondaryButton onClick={handleClose} className='w-full' disabled={isLoading}>
                Close
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ExtendModal
