'use client'

import { useState } from 'react'
import type { Address } from 'viem'
import { useOwnedNameOptions } from '@/hooks/settings/useOwnedNameOptions'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import NameImage from '@/components/ui/nameImage'
import Input from '@/components/ui/input'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useSettingsDirty } from '@/hooks/settings/useSettingsDirty'
import { QueryError } from './shared'

interface OwnedNamePickerProps {
  address: Address
  assignedNames: string[]
  hideAssigned?: boolean
  excludeResolver?: Address
  disabled: boolean
  checking: boolean
  onAdd: (names: string[]) => Promise<boolean>
}

const OwnedNamePicker: React.FC<OwnedNamePickerProps> = ({
  address,
  assignedNames,
  hideAssigned = false,
  excludeResolver,
  disabled,
  checking,
  onAdd,
}) => {
  const picker = useOwnedNameOptions(address, excludeResolver)
  const [selection, setSelection] = useState<string[]>([])
  const assigned = new Set(assignedNames.map((name) => name.toLowerCase()))
  const options = picker.options.filter((option) => !hideAssigned || !assigned.has(option.name.toLowerCase()))
  const selected = selection.filter((name) => !assigned.has(name.toLowerCase()) && !picker.excludedNames.includes(name))

  useSettingsDirty(selected.length > 0, false, selected.length)

  const add = async () => {
    if (!selected.length || disabled || picker.filtering) return

    if (await onAdd(selected)) setSelection([])
  }

  return (
    <div className='flex flex-col gap-3'>
      <Input
        label='Search'
        value={picker.search}
        onChange={(event) => picker.setSearch(event.target.value)}
        placeholder='Search your names'
        disabled={disabled}
      />
      <div className='border-tertiary max-h-80 overflow-y-auto rounded-md border' aria-label='Your names'>
        {options.map((option) => {
          const alreadyAssigned = assigned.has(option.name.toLowerCase())
          const checked = selected.includes(option.name)

          return (
            <label
              key={option.name}
              className={cn(
                'border-tertiary hover:bg-secondary flex cursor-pointer items-center gap-3 border-b px-3 py-3 text-lg transition-colors last:border-b-0',
                checked && 'bg-secondary text-primary',
                (disabled || alreadyAssigned) && 'cursor-not-allowed opacity-50'
              )}
            >
              <input
                type='checkbox'
                className='accent-primary h-5 w-5 shrink-0 cursor-pointer disabled:cursor-not-allowed'
                aria-label={`Select ${option.name}`}
                checked={checked}
                disabled={disabled || alreadyAssigned}
                onChange={(event) =>
                  setSelection((previous) =>
                    event.target.checked ? [...previous, option.name] : previous.filter((name) => name !== option.name)
                  )
                }
              />
              <NameImage
                name={option.name}
                tokenId={option.token_id}
                version={option.version}
                expiryDate={option.expiry_date}
                forceRegStatus='Registered'
                width={32}
                height={32}
                className='shrink-0'
              />
              <span className='min-w-0 flex-1 truncate'>{beautifyName(option.name)}</span>
              {alreadyAssigned && <span className='text-neutral shrink-0 text-sm'>Already assigned</span>}
            </label>
          )
        })}
        {picker.searching ? (
          <p className='text-neutral p-3 text-lg'>Loading your names…</p>
        ) : (
          !options.length && (
            <p className='text-neutral p-3 text-lg'>
              {hideAssigned ? 'No available names found.' : 'No names found. Try searching for a full name.'}
            </p>
          )
        )}
        {picker.names.hasNextPage && (
          <button
            type='button'
            className='text-primary w-full cursor-pointer p-3 text-lg disabled:cursor-not-allowed disabled:opacity-50'
            disabled={disabled || picker.searching}
            onClick={() => picker.names.fetchNextPage()}
          >
            Load more
          </button>
        )}
      </div>
      {picker.names.isError && <QueryError error={picker.names.error} retry={() => picker.names.refetch()} />}
      {picker.exclusions.isError && (
        <QueryError error={picker.exclusions.error} retry={() => picker.exclusions.refetch()} />
      )}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3 text-lg' aria-live='polite'>
          <span className='text-neutral'>{selected.length} selected</span>
          {!!selected.length && (
            <button
              type='button'
              className='text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
              disabled={disabled}
              onClick={() => setSelection([])}
            >
              Clear
            </button>
          )}
        </div>
        <SecondaryButton disabled={!selected.length || disabled || picker.filtering} onClick={add}>
          {checking ? 'Checking names…' : 'Add selected'}
        </SecondaryButton>
      </div>
    </div>
  )
}

export default OwnedNamePicker
