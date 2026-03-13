import Image from 'next/image'
import { AccountResponseType } from 'ethereum-identity-kit'
import Dropdown from '@/components/ui/dropdown'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import DatePicker from '@/components/ui/datepicker'
import { beautifyName } from '@/lib/ens'
import type { NameRegistrationEntry, TimeUnit, CalculationResults } from '@/types/registration'
import { timeUnitOptions } from '@/constants/registration'
import PerNameDurationEditor from './per-name-duration-editor'
import CustomOwnerSection from './custom-owner-section'
import CostSummary from './cost-summary'
import Calendar from 'public/icons/calendar.svg'
// import ReverseRecordSection from './reverse-record'

interface ReviewFormProps {
  isBulk: boolean
  firstName: string | null
  entries: NameRegistrationEntry[]
  availableEntries: NameRegistrationEntry[]
  registrationMode: string
  timeUnit: TimeUnit
  quantity: number
  customDuration: number
  entryDurations: (number | null)[]
  allDurationsValid: boolean
  showDatePicker: boolean
  setShowDatePicker: (show: boolean) => void
  perNameDatePickerIndex: number | null
  setPerNameDatePickerIndex: (index: number | null) => void
  showPerNameDurations: boolean
  setShowPerNameDurations: (show: boolean) => void
  perNamePrices: (bigint | null)[] | null | undefined
  showCustomOwner: boolean
  setShowCustomOwner: (show: boolean) => void
  customOwner: string
  setCustomOwner: (value: string) => void
  debouncedCustomOwner: string
  account: AccountResponseType | null | undefined
  reverseRecord: boolean
  setReverseRecord: (reverseRecord: boolean) => void
  isResolving: boolean
  calculationResults: CalculationResults | null
  hasSufficientBalance: boolean
  allNamesValid: boolean
  allAvailabilityChecked: boolean
  totalBatches: number
  gasEstimate: bigint | null
  gasPrice: bigint | undefined
  onTimeUnitChange: (value: string) => void
  onQuantityChange: (value: number) => void
  onCustomDateSelect: (timestamp: number) => void
  onSelectCustomDate: () => void
  onEntryDurationChange: (index: number, value: string) => void
  onEntryQuantityChange: (index: number, value: number) => void
  onEntryDateSelect: (timestamp: number) => void
  handleCommit: () => void
  handleClose: () => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  isBulk,
  firstName,
  entries,
  availableEntries,
  registrationMode,
  timeUnit,
  quantity,
  customDuration,
  entryDurations,
  allDurationsValid,
  showDatePicker,
  setShowDatePicker,
  perNameDatePickerIndex,
  setPerNameDatePickerIndex,
  showPerNameDurations,
  setShowPerNameDurations,
  perNamePrices,
  showCustomOwner,
  setShowCustomOwner,
  customOwner,
  setCustomOwner,
  debouncedCustomOwner,
  account,
  isResolving,
  // reverseRecord,
  // setReverseRecord,
  calculationResults,
  hasSufficientBalance,
  allNamesValid,
  allAvailabilityChecked,
  totalBatches,
  gasEstimate,
  gasPrice,
  onTimeUnitChange,
  onQuantityChange,
  onCustomDateSelect,
  onSelectCustomDate,
  onEntryDurationChange,
  onEntryQuantityChange,
  onEntryDateSelect,
  handleCommit,
  handleClose,
}) => {
  return (
    <div className='flex w-full flex-col gap-2 sm:gap-2'>
      <div className='flex w-full flex-row gap-2'>
        <Dropdown
          label='Unit'
          hideLabel={true}
          options={timeUnitOptions}
          value={timeUnit}
          onSelect={(value) => onTimeUnitChange(String(value))}
          className='w-2/5'
        />
        {registrationMode === 'register_for' ? (
          <Input
            type='number'
            label='Quantity'
            placeholder='Number'
            min={1}
            hideLabel={true}
            className='w-3/5'
            value={quantity || ''}
            onChange={(e) => onQuantityChange(Number(e.target.value))}
          />
        ) : (
          <>
            <PrimaryButton onClick={() => setShowDatePicker(true)} className='h-12! w-full'>
              {customDuration
                ? new Date(customDuration * 1000 + Date.now()).toLocaleDateString(navigator.language || 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                : 'Select Date'}
            </PrimaryButton>
            {showDatePicker && (
              <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'>
                <DatePicker
                  onSelect={onCustomDateSelect}
                  onClose={() => setShowDatePicker(false)}
                  className='w-full max-w-sm'
                />
              </div>
            )}
          </>
        )}
      </div>
      <button
        onClick={onSelectCustomDate}
        className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
      >
        <p>Select a custom date</p>
        <Image src={Calendar} alt='calendar' width={18} height={18} />
      </button>
      {isBulk && (
        <PerNameDurationEditor
          entries={entries}
          availableEntries={availableEntries}
          entryDurations={entryDurations}
          perNamePrices={perNamePrices}
          timeUnit={timeUnit}
          quantity={quantity}
          customDuration={customDuration}
          showPerNameDurations={showPerNameDurations}
          setShowPerNameDurations={setShowPerNameDurations}
          setPerNameDatePickerIndex={setPerNameDatePickerIndex}
          onEntryDurationChange={onEntryDurationChange}
          onEntryQuantityChange={onEntryQuantityChange}
        />
      )}
      {perNameDatePickerIndex !== null && (
        <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'>
          <DatePicker
            onSelect={onEntryDateSelect}
            onClose={() => setPerNameDatePickerIndex(null)}
            className='w-full max-w-sm'
          />
        </div>
      )}
      <CustomOwnerSection
        showCustomOwner={showCustomOwner}
        setShowCustomOwner={setShowCustomOwner}
        customOwner={customOwner}
        setCustomOwner={setCustomOwner}
        debouncedCustomOwner={debouncedCustomOwner}
        account={account}
        isResolving={isResolving}
      />
      <CostSummary
        calculationResults={calculationResults}
        isBulk={isBulk}
        availableEntries={availableEntries}
        totalBatches={totalBatches}
        hasSufficientBalance={hasSufficientBalance}
        allNamesValid={allNamesValid}
        gasEstimate={gasEstimate}
        gasPrice={gasPrice}
      />
      {/* <ReverseRecordSection reverseRecord={reverseRecord} setReverseRecord={setReverseRecord} /> */}
      <div className='flex flex-col gap-2'>
        <PrimaryButton
          onClick={handleCommit}
          disabled={
            !calculationResults ||
            !hasSufficientBalance ||
            !allNamesValid ||
            !allDurationsValid ||
            (registrationMode === 'register_to' && customDuration === 0) ||
            !allAvailabilityChecked ||
            availableEntries.length === 0 ||
            calculationResults?.isBelowMinimum
          }
          className='w-full'
        >
          {!allNamesValid
            ? 'Invalid Name'
            : !hasSufficientBalance
              ? 'Insufficient ETH Balance'
              : calculationResults?.isBelowMinimum
                ? 'Duration Too Short (28 days minimum)'
                : !allAvailabilityChecked
                  ? 'Checking Availability...'
                  : isBulk
                    ? `Register ${availableEntries.length} Names`
                    : `Register ${beautifyName(firstName!)}`}
        </PrimaryButton>
        <SecondaryButton onClick={handleClose} className='w-full'>
          Close
        </SecondaryButton>
      </div>
    </div>
  )
}

export default ReviewForm
