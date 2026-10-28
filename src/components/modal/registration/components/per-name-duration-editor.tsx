import { useState } from 'react'
import { Address, formatUnits } from 'viem'
import DurationField from '@/components/ui/modal/durationField'
import NameList, { type NameListItem } from '@/components/ui/modal/nameList'
import { beautifyName } from '@/lib/ens'
import { MIN_REGISTRATION_DURATION } from '@/constants/registration'
import { TOKEN_DECIMALS, TOKENS } from '@/constants/web3/tokens'
import type { NameRegistrationEntry, TimeUnit } from '@/types/registration'
import { getPricingAsset } from '@/lib/ethPayment'

interface PerNameDurationEditorProps {
  entries: NameRegistrationEntry[]
  availableEntries: NameRegistrationEntry[]
  entryDurations: (number | null)[]
  perNamePrices: readonly bigint[] | null | undefined
  perNamePremiums: readonly bigint[] | undefined
  asset: Address
  timeUnit: TimeUnit
  quantity: number
  customDuration: number
  setPerNameDatePickerIndex: (index: number | null) => void
  onEntryDurationChange: (index: number, value: string) => void
  onEntryQuantityChange: (index: number, value: number) => void
  onEntryDurationReset: (index: number) => void
}

const formatEndDate = (seconds: number) => new Date(seconds * 1000 + Date.now()).toLocaleDateString()

const formatQuantity = (quantity: number, unit: TimeUnit) =>
  `${quantity} ${quantity === 1 ? unit.replace(/s$/, '') : unit}`

const PerNameDurationEditor: React.FC<PerNameDurationEditorProps> = ({
  entries,
  availableEntries,
  entryDurations,
  perNamePrices,
  perNamePremiums,
  asset,
  timeUnit,
  quantity,
  customDuration,
  setPerNameDatePickerIndex,
  onEntryDurationChange,
  onEntryQuantityChange,
  onEntryDurationReset,
}) => {
  // Per-name quotes are in USDC when paying with ETH
  const pricingAsset = getPricingAsset(asset)
  const [openKey, setOpenKey] = useState<string | null>(null)

  const items: NameListItem[] = entries.map((entry, index) => {
    const entryUnit = entry.timeUnit ?? timeUnit
    const entryQuantity = entry.quantity ?? quantity
    const entryCustomDuration = entry.customDuration || customDuration
    const isCustomUnit = entryUnit === 'custom'
    const duration = entryDurations[index]
    const isBelowMinimum = duration !== null && duration < MIN_REGISTRATION_DURATION
    const availableIndex = availableEntries.indexOf(entry)
    const price = perNamePrices && availableIndex >= 0 ? perNamePrices[availableIndex] : null
    const premium = availableIndex >= 0 ? perNamePremiums?.[availableIndex] : undefined
    const warning = isBelowMinimum ? 'Duration below 28-day minimum' : undefined

    return {
      key: `${entry.name}-${index}`,
      name: beautifyName(entry.name),
      status:
        entry.isAvailable === false
          ? 'unavailable'
          : entry.isAvailable === null || premium === undefined
            ? 'checking'
            : premium > BigInt(0)
              ? 'premium'
              : 'available',
      price:
        price !== null && price !== undefined
          ? `${Number(formatUnits(price, TOKEN_DECIMALS[TOKENS[pricingAsset]])).toFixed(2)} ${TOKENS[pricingAsset]}`
          : undefined,
      duration: isCustomUnit
        ? entryCustomDuration
          ? `Until ${formatEndDate(entryCustomDuration)}`
          : 'Select Date'
        : formatQuantity(entryQuantity, entryUnit),
      isCustom: entry.timeUnit !== null,
      warning,
      editor: (
        <DurationField
          compact
          quantity={entryQuantity}
          unit={entryUnit}
          isCustom={isCustomUnit}
          customDateLabel={entryCustomDuration ? formatEndDate(entryCustomDuration) : null}
          onQuantityChange={(value) => onEntryQuantityChange(index, value)}
          onUnitChange={(value) => onEntryDurationChange(index, value)}
          onPickDate={() => setPerNameDatePickerIndex(index)}
          onSync={() => onEntryDurationReset(index)}
          isSynced={entry.timeUnit === null}
          warning={warning}
        />
      ),
    }
  })

  return <NameList items={items} openKey={openKey} onToggle={setOpenKey} />
}

export default PerNameDurationEditor
