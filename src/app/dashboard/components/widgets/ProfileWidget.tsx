'use client'

import React, { useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectProfileViewConfig } from '@/state/reducers/dashboard/selectors'
import { beautifyName } from '@/lib/ens'
import Profile from '@/app/profile/[user]/components/profile'

interface ProfileWidgetProps {
  instanceId: string
}

const isAddress = (v: string) => /^0x[0-9a-fA-F]{40}$/.test(v)

const ProfileWidget: React.FC<ProfileWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectProfileViewConfig(state, instanceId))
  const [localQuery, setLocalQuery] = useState(config?.query ?? '')

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const raw = localQuery.trim()
      if (!raw) return
      const resolved = isAddress(raw) ? raw.toLowerCase() : beautifyName(raw.includes('.') ? raw : `${raw}.eth`)
      dispatch(updateComponentConfig({ id: instanceId, patch: { query: localQuery, submittedUser: resolved } }))
    },
    [dispatch, instanceId, localQuery]
  )

  const handleClear = useCallback(() => {
    setLocalQuery('')
    dispatch(updateComponentConfig({ id: instanceId, patch: { query: '', submittedUser: null } }))
  }, [dispatch, instanceId])

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <form onSubmit={handleSubmit} className='border-tertiary flex items-center border-b'>
        <input
          type='text'
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder='ENS name or 0x address'
          spellCheck={false}
          autoCapitalize='none'
          autoCorrect='off'
          className='h-10 min-w-0 flex-1 px-3 text-lg outline-none'
        />
        {config.submittedUser && (
          <button
            type='button'
            onClick={handleClear}
            className='text-neutral border-tertiary hover:bg-secondary h-10 cursor-pointer border-l px-3 text-sm transition-colors'
          >
            Clear
          </button>
        )}
        <button
          type='submit'
          className='bg-primary text-background hover:bg-primary/90 h-10 shrink-0 cursor-pointer px-4 text-sm font-semibold transition-colors'
        >
          Search
        </button>
      </form>

      <div className='flex-1 overflow-auto'>
        {config.submittedUser ? (
          <Profile user={config.submittedUser} />
        ) : (
          <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
            Enter a name or address above to view a profile.
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileWidget
