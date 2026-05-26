import Image from 'next/image'
import { useMemo, useState } from 'react'
import Calendar from 'public/icons/calendar.svg'
import Dropdown, { type DropdownOption } from '@/components/ui/dropdown'
import Input from '@/components/ui/input'
import DatePicker from '@/components/ui/datepicker'
import { cn } from '@/utils/tailwind'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { getTierMetadata } from '../tierMetadata'

export type DurationUnit = 'days' | 'weeks' | 'months' | 'years'

export const DAYS_PER_UNIT: Record<DurationUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
}

export const MIN_DURATION_DAYS = 30

const unitOptions: DropdownOption[] = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
]

const getMinCountForUnit = (unit: DurationUnit): number => Math.ceil(MIN_DURATION_DAYS / DAYS_PER_UNIT[unit])

interface DurationStepProps {
  selectedTierId: number
  unit: DurationUnit
  count: number
  durationDays: number
  onUnitChange: (unit: DurationUnit) => void
  onCountChange: (count: number) => void
  onDateSelect: (timestamp: number) => void
  price: bigint | null
  isPriceLoading: boolean
  ethPrice: number
}

const DurationStep: React.FC<DurationStepProps> = ({
  selectedTierId,
  unit,
  count,
  durationDays,
  onUnitChange,
  onCountChange,
  onDateSelect,
  price,
  isPriceLoading,
  ethPrice,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const meta = getTierMetadata(selectedTierId)
  const minCount = getMinCountForUnit(unit)
  const isBelowMin = durationDays < MIN_DURATION_DAYS

  const priceETH = useMemo(() => (price === null ? null : Number(price) / 10 ** TOKEN_DECIMALS.ETH), [price])
  const priceUSD = useMemo(() => (priceETH === null ? null : priceETH * ethPrice), [priceETH, ethPrice])

  // minDate for the picker: today + 30 days (start of day)
  const minPickerDate = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + MIN_DURATION_DAYS)
    return d
  }, [])

  const endDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + durationDays)
    return d
  }, [durationDays])

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center gap-3'>
        <Image src={meta.logo} alt={meta.name} width={32} height={32} className='h-8 w-8 shrink-0' />
        <div className='flex flex-col leading-tight'>
          <p className={cn('font-sedan-sc text-2xl', meta.colors.text)}>{meta.name}</p>
          <p className='text-neutral text-md'>{meta.tagline}</p>
        </div>
      </div>

      <p className='text-md text-neutral mt-2 font-medium'>Duration</p>
      <div className='flex w-full flex-row gap-2'>
        <Dropdown
          label='Unit'
          hideLabel
          options={unitOptions}
          value={unit}
          onSelect={(value) => onUnitChange(value as DurationUnit)}
          className='h-12! w-2/5'
        />
        <Input
          type='number'
          label='Count'
          placeholder='Count'
          min={minCount}
          hideLabel
          className='w-3/5'
          value={count || ''}
          onChange={(e) => onCountChange(Math.max(0, Number(e.target.value)))}
        />
      </div>

      <button
        type='button'
        onClick={() => setShowDatePicker(true)}
        className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
      >
        <p>Or pick an end date</p>
        <Image src={Calendar} alt='calendar' width={18} height={18} />
      </button>

      {showDatePicker && (
        <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'>
          <DatePicker
            onSelect={(timestamp) => {
              onDateSelect(timestamp)
              setShowDatePicker(false)
            }}
            onClose={() => setShowDatePicker(false)}
            minDate={minPickerDate}
            hideTime
            className='w-full max-w-sm'
          />
        </div>
      )}

      <div
        className={cn(
          'bg-secondary border-tertiary rounded-lg border p-3 transition-opacity',
          isPriceLoading && 'opacity-60'
        )}
      >
        <div className='flex items-center justify-between'>
          <p className='text-md'>{durationDays} days</p>
          <p className='text-neutral text-md'>ends {endDate.toLocaleDateString()}</p>
        </div>
        <div className='mt-2 flex items-center justify-between'>
          <p className='text-md text-neutral'>Price</p>
          <div className='flex flex-col items-end'>
            <p className='text-md font-medium'>{priceETH !== null ? `${priceETH.toFixed(6)} ETH` : '—'}</p>
            {priceUSD !== null && <p className='text-neutral text-xs'>(${priceUSD.toFixed(2)})</p>}
          </div>
        </div>
      </div>

      {isBelowMin && (
        <div className='rounded-lg border border-amber-500/30 bg-amber-900/20 p-3'>
          <p className='text-md text-amber-400'>Minimum subscription duration is {MIN_DURATION_DAYS} days.</p>
        </div>
      )}
    </div>
  )
}

export default DurationStep
