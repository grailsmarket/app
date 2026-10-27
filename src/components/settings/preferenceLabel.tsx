'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import type { Address } from 'viem'
import PencilIcon from 'public/icons/pencil-white.svg'
import Label from '@/components/ui/label'
import { useResolverPreferences, useUpdateResolverPreferences } from '@/hooks/settings/useResolverPreferences'
import { useSettingsDirty } from '@/hooks/settings/useSettingsDirty'

interface PreferenceLabelProps {
  resolver: Address
  id?: bigint
  label: string | null
  title: string
  available: boolean
  preferred?: boolean
}

const PreferenceLabel: React.FC<PreferenceLabelProps> = ({
  resolver,
  id,
  label,
  title,
  available,
  preferred = false,
}) => {
  const { account } = useResolverPreferences(false)
  const mutation = useUpdateResolverPreferences()
  const [draft, setDraft] = useState<string | null>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const value = draft?.trim() ?? ''
  const changed = draft !== null && value !== (label ?? '')
  const editable = !!account && available && id !== BigInt(0)
  const field = id === undefined ? 'Resolver label' : 'Configuration label'
  const editLabel = `Edit ${field.toLowerCase()}`

  useSettingsDirty(changed, mutation.isPending)

  const save = () => {
    if (!account || !editable || mutation.isPending) return

    if (changed)
      mutation.mutate(
        id === undefined
          ? { type: 'resolver-label', account, resolver, label: value || null }
          : { type: 'configuration-label', account, resolver, id: id.toString(), label: value || null }
      )
    setDraft(null)
    requestAnimationFrame(() => editButton.current?.focus())
  }

  return (
    <div className='flex min-w-0 flex-col gap-1' aria-busy={mutation.isPending}>
      <div className='flex items-center gap-2'>
        {draft === null ? (
          <>
            <h2 className='text-2xl font-semibold'>{title}</h2>
            {editable && (
              <button
                ref={editButton}
                type='button'
                aria-label={editLabel}
                title={editLabel}
                disabled={mutation.isPending}
                onClick={() => {
                  mutation.reset()
                  setDraft(label ?? '')
                }}
                className='hover:bg-tertiary flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors disabled:cursor-default disabled:opacity-50'
              >
                <Image src={PencilIcon} alt='' width={16} height={16} />
              </button>
            )}
          </>
        ) : (
          <form
            className='min-w-0'
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <input
              aria-label={field}
              className='border-tertiary bg-secondary focus:border-primary h-8 w-56 max-w-full rounded-sm border px-2 text-xl font-semibold outline-none'
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onFocus={(event) => event.target.select()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault()
                if (event.key === 'Escape') {
                  event.preventDefault()
                  setDraft(null)
                  requestAnimationFrame(() => editButton.current?.focus())
                }
              }}
              maxLength={64}
              placeholder={id === undefined ? 'Resolver' : `Configuration ${id}`}
              autoFocus
            />
          </form>
        )}
        {preferred && <Label label='Preferred' className='bg-primary/10 text-primary text-sm' />}
      </div>
      {mutation.isError && (
        <p role='alert' className='text-sm text-red-400'>
          {mutation.error.message}
        </p>
      )}
    </div>
  )
}

export default PreferenceLabel
