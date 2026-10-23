import { AccountResponseType } from 'ethereum-identity-kit'
import { Address } from 'viem'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import DurationField from '@/components/ui/modal/durationField'
import Segmented from '@/components/ui/modal/segmented'
import Notice from '@/components/ui/modal/notice'
import { beautifyName } from '@/lib/ens'
import type {
  NameRegistrationEntry,
  TimeUnit,
  CalculationResults,
  SufficientBalanceResults,
} from '@/types/registration'
import PerNameDurationEditor from './per-name-duration-editor'
import CustomOwnerSection from './custom-owner-section'
import ResolverSection from './resolver-section'
import CostSummary from './cost-summary'
import { registrationAssets } from '@/constants/web3/tokens'
import type { Resolver } from '@/types/ens'

interface ReviewFormProps {
  isBulk: boolean
  entries: NameRegistrationEntry[]
  availableEntries: NameRegistrationEntry[]
  unavailableEntries: NameRegistrationEntry[]
  registrationMode: string
  timeUnit: TimeUnit
  quantity: number
  customDuration: number
  entryDurations: (number | null)[]
  asset: Address
  setAsset: (newasset: Address) => void
  setShowDatePicker: (show: boolean) => void
  setPerNameDatePickerIndex: (index: number | null) => void
  perNamePrices: readonly bigint[] | null | undefined
  showCustomOwner: boolean
  setShowCustomOwner: (show: boolean) => void
  customOwner: string
  setCustomOwner: (value: string) => void
  account: AccountResponseType | null | undefined
  isResolving: boolean
  resolver: string
  setResolver: (value: string) => void
  resolverError: string | null
  resolverOptions: Resolver[]
  resolverWarning: string | null
  isCheckingResolver: boolean
  hasRegistrationParameters: boolean
  calculationResults: CalculationResults | null
  hasSufficientBalance: SufficientBalanceResults
  allNamesValid: boolean
  gasEstimate: bigint | null
  gasPrice: bigint | undefined
  totalBatches: number
  onTimeUnitChange: (value: string) => void
  onQuantityChange: (value: number) => void
  onSelectCustomDate: () => void
  onEntryDurationChange: (index: number, value: string) => void
  onEntryQuantityChange: (index: number, value: number) => void
  onEntryDurationReset: (index: number) => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  isBulk,
  entries,
  availableEntries,
  unavailableEntries,
  registrationMode,
  timeUnit,
  quantity,
  customDuration,
  entryDurations,
  asset,
  setAsset,
  setShowDatePicker,
  setPerNameDatePickerIndex,
  perNamePrices,
  showCustomOwner,
  setShowCustomOwner,
  customOwner,
  setCustomOwner,
  account,
  isResolving,
  resolver,
  setResolver,
  resolverError,
  resolverOptions,
  resolverWarning,
  isCheckingResolver,
  hasRegistrationParameters,
  calculationResults,
  hasSufficientBalance,
  allNamesValid,
  gasEstimate,
  gasPrice,
  totalBatches,
  onTimeUnitChange,
  onQuantityChange,
  onSelectCustomDate,
  onEntryDurationChange,
  onEntryQuantityChange,
  onEntryDurationReset,
}) => {
  return (
    <>
      {hasRegistrationParameters && (
        <Notice tone='info'>These settings are fixed for your pending registration.</Notice>
      )}
      {unavailableEntries.length > 0 && (
        <Notice tone='warning'>
          {unavailableEntries.length} name{unavailableEntries.length > 1 ? 's are' : ' is'} not available and will be
          excluded: {unavailableEntries.map((e) => beautifyName(e.name)).join(', ')}
        </Notice>
      )}
      <fieldset disabled={hasRegistrationParameters} className='flex min-w-0 flex-col gap-2 disabled:opacity-70'>
        <DurationField
          quantity={quantity}
          unit={timeUnit}
          isCustom={registrationMode !== 'register_for'}
          customDateLabel={
            customDuration
              ? new Date(customDuration * 1000 + Date.now()).toLocaleDateString(navigator.language || 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null
          }
          onQuantityChange={onQuantityChange}
          onUnitChange={onTimeUnitChange}
          onPickDate={() => setShowDatePicker(true)}
          onSelectCustomDate={onSelectCustomDate}
          hint={isBulk ? 'Applies to every name. Change a single name in the list below.' : undefined}
        />
        {isBulk && (
          <PerNameDurationEditor
            entries={entries}
            availableEntries={availableEntries}
            entryDurations={entryDurations}
            perNamePrices={perNamePrices}
            asset={asset}
            timeUnit={timeUnit}
            quantity={quantity}
            customDuration={customDuration}
            setPerNameDatePickerIndex={setPerNameDatePickerIndex}
            onEntryDurationChange={onEntryDurationChange}
            onEntryQuantityChange={onEntryQuantityChange}
            onEntryDurationReset={onEntryDurationReset}
          />
        )}
        <Segmented options={registrationAssets} value={asset} onChange={setAsset} />
        <CustomOwnerSection
          showCustomOwner={showCustomOwner}
          setShowCustomOwner={setShowCustomOwner}
          customOwner={customOwner}
          setCustomOwner={setCustomOwner}
          account={account}
          isResolving={isResolving}
        />
        <ResolverSection
          resolver={resolver}
          setResolver={setResolver}
          isLoading={isCheckingResolver}
          error={resolverError}
          options={resolverOptions}
          warning={resolverWarning}
        />
      </fieldset>
      <CostSummary
        calculationResults={calculationResults}
        isBulk={isBulk}
        availableEntries={availableEntries}
        totalBatches={totalBatches}
        hasSufficientBalance={hasSufficientBalance}
        allNamesValid={allNamesValid}
        gasEstimate={gasEstimate}
        gasPrice={gasPrice}
        asset={asset}
      />
    </>
  )
}

interface ReviewActionsProps {
  isBulk: boolean
  firstName: string | null
  availableEntries: NameRegistrationEntry[]
  registrationMode: string
  customDuration: number
  allDurationsValid: boolean
  resolver: string
  resolverError: string | null
  isCheckingResolver: boolean
  calculationResults: CalculationResults | null
  hasSufficientBalance: SufficientBalanceResults
  allNamesValid: boolean
  allAvailabilityChecked: boolean
  handleCommit: () => void
  handleClose: () => void
}

export const ReviewActions: React.FC<ReviewActionsProps> = ({
  isBulk,
  firstName,
  availableEntries,
  registrationMode,
  customDuration,
  allDurationsValid,
  resolver,
  resolverError,
  isCheckingResolver,
  calculationResults,
  hasSufficientBalance,
  allNamesValid,
  allAvailabilityChecked,
  handleCommit,
  handleClose,
}) => {
  return (
    <>
      <PrimaryButton
        onClick={handleCommit}
        disabled={
          !calculationResults ||
          isCheckingResolver ||
          (!!resolver.trim() && !!resolverError) ||
          !hasSufficientBalance ||
          !allNamesValid ||
          !allDurationsValid ||
          (registrationMode === 'register_to' && customDuration === 0) ||
          !allAvailabilityChecked ||
          availableEntries.length === 0 ||
          calculationResults?.isBelowMinimum
        }
        className={modalPrimaryActionClassName}
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
      <SecondaryButton onClick={handleClose} className={modalActionClassName}>
        Close
      </SecondaryButton>
    </>
  )
}

export default ReviewForm
