'use client'

import React, { useCallback, useState } from 'react'
import { useContainerWidth } from 'react-grid-layout'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectNameViewConfig } from '@/state/reducers/dashboard/selectors'
import { beautifyName } from '@/lib/ens'
import NamePage from '@/app/[name]/components/name'

interface NameWidgetProps {
  instanceId: string
}

const NameWidget: React.FC<NameWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectNameViewConfig(state, instanceId))
  const [localQuery, setLocalQuery] = useState(config?.query ?? '')
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true })

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const raw = localQuery.trim()
      if (!raw) return
      const withTld = raw.includes('.') ? raw : `${raw}.eth`
      const beautified = beautifyName(withTld)
      dispatch(updateComponentConfig({ id: instanceId, patch: { query: localQuery, submittedName: beautified } }))
    },
    [dispatch, instanceId, localQuery]
  )

  const handleClear = useCallback(() => {
    setLocalQuery('')
    dispatch(updateComponentConfig({ id: instanceId, patch: { query: '', submittedName: null } }))
  }, [dispatch, instanceId])

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <form onSubmit={handleSubmit} className='border-tertiary flex items-center border-b'>
        <input
          type='text'
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder='Search a name (e.g. vitalik.eth)'
          spellCheck={false}
          autoCapitalize='none'
          autoCorrect='off'
          className='h-10 min-w-0 flex-1 px-3 text-lg outline-none'
        />
        {config.submittedName && (
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

      <div ref={containerRef} className='relative flex-1 overflow-x-hidden overflow-y-auto'>
        {config.submittedName ? (
          <NamePage
            name={config.submittedName}
            isWidget
            containerWidth={mounted ? width : 0}
            scrollElementRef={containerRef}
          />
        ) : (
          <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
            Enter a name above to look it up.
          </div>
        )}
      </div>
    </div>
  )
}

export default NameWidget
