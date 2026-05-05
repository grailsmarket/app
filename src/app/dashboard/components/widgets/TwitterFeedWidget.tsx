'use client'

import React from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectTwitterFeedConfig } from '@/state/reducers/dashboard/selectors'

interface TwitterFeedWidgetProps {
  instanceId: string
}

const TwitterFeedWidget: React.FC<TwitterFeedWidgetProps> = ({ instanceId }) => {
  const config = useAppSelector((state) => selectTwitterFeedConfig(state, instanceId))

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      {/* <div className='border-tertiary flex shrink-0 flex-col gap-1 border-b px-3 py-2'>
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              commitHandle()
            }}
            className='flex items-center gap-2'
          >
            <span className='text-neutral text-sm font-medium'>@</span>
            <input
              autoFocus
              value={draftHandle}
              onChange={(e) => setDraftHandle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEditing()
              }}
              placeholder='ENSMarketBot'
              spellCheck={false}
              autoCapitalize='none'
              autoCorrect='off'
              className='border-tertiary focus:border-primary/60 h-8 min-w-0 flex-1 rounded-sm border bg-transparent px-2 text-sm transition-colors outline-none'
            />
            <button
              type='submit'
              className='bg-primary text-background hover:bg-primary/90 h-8 cursor-pointer rounded-sm px-3 text-xs font-semibold transition-colors'
            >
              Set
            </button>
            <button
              type='button'
              onClick={cancelEditing}
              className='text-neutral hover:bg-secondary h-8 cursor-pointer rounded-sm px-2 text-xs transition-colors'
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className='flex items-center justify-between gap-2'>
            <button
              type='button'
              onClick={startEditing}
              className='hover:bg-secondary flex min-w-0 cursor-pointer items-center gap-1 rounded-sm px-1 py-1 text-left transition-colors'
            >
              <span className='truncate text-sm font-semibold'>@{handle}</span>
              <span className='text-neutral shrink-0 text-xs'>· Change</span>
            </button>
            <a
              href={`https://x.com/${handle}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:text-primary/80 shrink-0 text-xs font-semibold'
            >
              Open on 𝕏
            </a>
          </div>
        )}
        {error && <span className='text-grace text-xs font-medium'>{error}</span>}
      </div> */}

      <div className='relative flex-1 overflow-hidden'>
        <iframe src="https://www.juicer.io/api/feeds/ensmarketbot/iframe" frameBorder="0" width="1000" height="1000" style={{ display: 'block', padding: '0px 2px', margin: '0 auto', width: '100%', height: '100%' }} title="ENSMarketBot - Juicer social media feed"></iframe>
      </div>
    </div>
  )
}

export default TwitterFeedWidget
