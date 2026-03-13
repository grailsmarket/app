import Dropdown from '@/components/ui/dropdown'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import { cn } from '@/utils/tailwind'
import { beautifyName } from '@/lib/ens'
import type { NameRegistrationEntry, TimeUnit } from '@/types/registration'
import { timeUnitOptions, MIN_REGISTRATION_DURATION } from '@/constants/registration'
import Image from 'next/image'
import ArrowDownIcon from 'public/icons/arrow-down.svg'
import CalendarBlackIcon from 'public/icons/calendar-black.svg'

interface PerNameDurationEditorProps {
  entries: NameRegistrationEntry[]
  availableEntries: NameRegistrationEntry[]
  entryDurations: (number | null)[]
  perNamePrices: (bigint | null)[] | null | undefined
  timeUnit: TimeUnit
  quantity: number
  customDuration: number
  showPerNameDurations: boolean
  setShowPerNameDurations: (show: boolean) => void
  setPerNameDatePickerIndex: (index: number | null) => void
  onEntryDurationChange: (index: number, value: string) => void
  onEntryQuantityChange: (index: number, value: number) => void
}

const PerNameDurationEditor: React.FC<PerNameDurationEditorProps> = ({
  entries,
  availableEntries,
  entryDurations,
  perNamePrices,
  timeUnit,
  quantity,
  customDuration,
  showPerNameDurations,
  setShowPerNameDurations,
  setPerNameDatePickerIndex,
  onEntryDurationChange,
  onEntryQuantityChange,
}) => {
  return (
    <div className='flex flex-col gap-2 rounded-md'>
      <div
        onClick={() => setShowPerNameDurations(!showPerNameDurations)}
        className='bg-secondary hover:bg-tertiary border-tertiary flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors'
      >
        <p className='text-xl font-semibold'>Edit registration durations</p>
        <div className='flex items-center gap-2'>
          <p className='text-xl font-bold'>{availableEntries.length}</p>
          <Image
            src={ArrowDownIcon}
            alt='Arrow Down'
            width={16}
            height={16}
            className={cn(showPerNameDurations ? 'rotate-180' : '')}
          />
        </div>
      </div>
      {showPerNameDurations && (
        <div className='flex max-h-60 flex-col gap-2 overflow-y-auto'>
          {entries.map((entry, index) => {
            const entryUnit = entry.timeUnit ?? timeUnit
            const entryMode = entryUnit === 'custom' ? 'register_to' : 'register_for'
            const entryQty = entry.quantity ?? quantity
            const dur = entryDurations[index]
            const isBelowMin = dur !== null && dur < MIN_REGISTRATION_DURATION
            const perNamePrice =
              perNamePrices && availableEntries.indexOf(entry) >= 0
                ? perNamePrices[availableEntries.indexOf(entry)]
                : null

            return (
              <div key={index} className='border-tertiary flex flex-col gap-1.5 rounded-md border p-2'>
                <div className='flex items-center justify-between'>
                  <p className='max-w-2/3 truncate font-semibold'>{beautifyName(entry.name)}</p>
                  <div className='flex items-center gap-2'>
                    {entry.isAvailable === false && (
                      <span className='text-sm font-medium text-red-400'>Unavailable</span>
                    )}
                    {entry.isAvailable === true && (
                      <span className='text-sm font-medium text-green-400'>Available</span>
                    )}
                    {entry.isAvailable === null && (
                      <span className='text-neutral text-sm font-medium'>Checking...</span>
                    )}
                    {perNamePrice && (
                      <span className='text-neutral text-sm font-medium'>
                        {(Number(perNamePrice) / 10 ** 18).toFixed(4)} ETH
                      </span>
                    )}
                  </div>
                </div>
                {entry.isAvailable !== false && (
                  <div className='flex w-full gap-2'>
                    <Dropdown
                      label='Unit'
                      hideLabel={true}
                      options={timeUnitOptions}
                      value={entryUnit}
                      onSelect={(value) => onEntryDurationChange(index, String(value))}
                      className='w-2/5'
                    />
                    {entryMode === 'register_for' && (
                      <Input
                        type='number'
                        label='Qty'
                        placeholder='Qty'
                        min={1}
                        hideLabel={true}
                        className='w-3/5'
                        value={entryQty || ''}
                        onChange={(e) => onEntryQuantityChange(index, Number(e.target.value))}
                      />
                    )}
                    <PrimaryButton
                      onClick={() => setPerNameDatePickerIndex(index)}
                      className={cn(
                        'flex h-12! min-w-12! items-center justify-center p-0!',
                        entryMode === 'register_for' ? 'min-w-12!' : 'w-3/5'
                      )}
                    >
                      {entryUnit === 'custom' && (entry.customDuration || customDuration) ? (
                        new Date((entry.customDuration || customDuration) * 1000 + Date.now()).toLocaleDateString()
                      ) : (
                        <Image src={CalendarBlackIcon} alt='calendar' width={32} height={32} className='h-6 w-6' />
                      )}
                    </PrimaryButton>
                  </div>
                )}
                {isBelowMin && <p className='text-xs text-amber-400'>Duration below 28-day minimum</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PerNameDurationEditor
