'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ShortArrow } from 'ethereum-identity-kit'
import type { Address } from 'viem'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import type { NameAssignment } from '@/utils/settings/nameAssignments'
import TrashIcon from 'public/icons/trash.svg'
import OwnedNamePicker from './ownedNamePicker'

interface ConfigurationNamePickerProps {
  address: Address
  resolver: Address
  names: NameAssignment[]
  disabled: boolean
  checking: boolean
  onAdd: (names: string[]) => Promise<boolean>
  onRemove: (name: string) => void
}

const ConfigurationNamePicker: React.FC<ConfigurationNamePickerProps> = ({
  address,
  resolver,
  names,
  disabled,
  checking,
  onAdd,
  onRemove,
}) => {
  const [open, setOpen] = useState(false)
  const changesResolver = names.some(
    (assignment) => assignment.binding.resolver.toLowerCase() !== resolver.toLowerCase()
  )

  return (
    <section className='border-tertiary flex flex-col gap-3 border-b pb-5'>
      <button
        type='button'
        aria-expanded={open}
        className='flex w-full cursor-pointer items-center justify-between gap-3 text-lg font-semibold'
        onClick={() => setOpen(!open)}
      >
        <span>
          Assign names <span className='text-neutral font-normal'>(optional)</span>
        </span>
        <span className='flex items-center gap-3'>
          {!!names.length && <span className='text-neutral font-normal'>{names.length} added</span>}
          <ShortArrow className={cn('h-3.5 w-3.5', !open && 'rotate-180')} />
        </span>
      </button>
      <p className='text-neutral text-lg'>Choose names to use this configuration, or leave it unassigned for now.</p>
      {!!names.length && (
        <ul className='border-tertiary overflow-hidden rounded-md border'>
          {names.map((assignment) => (
            <li key={assignment.name} className='border-tertiary flex items-center gap-3 border-b p-3 last:border-b-0'>
              <NameImage
                name={assignment.name}
                tokenId=''
                version={2}
                expiryDate={null}
                forceRegStatus='Registered'
                width={32}
                height={32}
                className='shrink-0'
              />
              <div className='min-w-0 flex-1'>
                <p className='truncate text-lg'>{beautifyName(assignment.name)}</p>
                {assignment.binding.resolver.toLowerCase() !== resolver.toLowerCase() && (
                  <p className='text-neutral text-sm'>Resolver will change</p>
                )}
              </div>
              <button
                type='button'
                aria-label={`Remove ${assignment.name}`}
                disabled={disabled}
                onClick={() => onRemove(assignment.name)}
                className='flex h-8 w-8 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40'
              >
                <Image src={TrashIcon} alt='' width={16} height={18} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!!names.length && (
        <p className='text-neutral text-lg'>
          Selected names will use the records below.
          {changesResolver && ' Names using another resolver need a resolver-change transaction first.'}
        </p>
      )}
      <div hidden={!open}>
        <OwnedNamePicker
          address={address}
          assignedNames={names.map((assignment) => assignment.name)}
          disabled={disabled}
          checking={checking}
          onAdd={onAdd}
        />
      </div>
    </section>
  )
}

export default ConfigurationNamePicker
