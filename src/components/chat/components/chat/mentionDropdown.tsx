'use client'

import React, { useEffect } from 'react'
import { Avatar } from 'ethereum-identity-kit'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { searchProfiles } from '@/api/search-profiles'
import { useDebounce } from '@/hooks/useDebounce'
import { beautifyName } from '@/lib/ens'
import { formatAddress } from '@/utils/formatAddress'
import { cn } from '@/utils/tailwind'
import { ENS_METADATA_URL } from '@/constants/ens'
import Image from 'next/image'

interface Props {
  query: string
  selectedIndex: number
  onHoverIndex: (index: number) => void
  onSelect: (name: string) => void
  onResultsChange: (count: number) => void
  registerKeyboardSelect: (fn: (() => void) | null) => void
}

const MAX_RESULTS = 5

const MentionDropdown: React.FC<Props> = ({
  query,
  selectedIndex,
  onHoverIndex,
  onSelect,
  onResultsChange,
  registerKeyboardSelect,
}) => {
  const debouncedQuery = useDebounce(query, 200)

  const { data: profiles, isFetching } = useQuery({
    queryKey: ['chatMentions', debouncedQuery],
    queryFn: () => searchProfiles({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const results = (profiles ?? []).slice(0, MAX_RESULTS)
  const safeIndex = Math.min(selectedIndex, Math.max(0, results.length - 1))

  useEffect(() => {
    onResultsChange(results.length)
  }, [results.length, onResultsChange])

  // Expose the current selection to the parent so its keyboard handler can
  // commit without needing the result list itself.
  useEffect(() => {
    if (results.length === 0) {
      registerKeyboardSelect(null)
      return
    }
    registerKeyboardSelect(() => {
      const profile = results[safeIndex]
      if (profile) onSelect(profile.name)
    })
    return () => registerKeyboardSelect(null)
  }, [results, safeIndex, onSelect, registerKeyboardSelect])

  if (results.length === 0 && !isFetching) return null

  return (
    <div
      role='listbox'
      aria-label='Mention suggestions'
      // Prevent textarea blur when interacting with the dropdown.
      onMouseDown={(e) => e.preventDefault()}
      className='bg-background border-tertiary absolute right-0 bottom-full left-0 z-20 mb-2 max-h-64 overflow-y-auto rounded-md border-2 shadow-lg'
    >
      {results.length === 0 && isFetching ? (
        <div className='text-neutral p-3 text-lg'>Searching…</div>
      ) : (
        results.map((profile, index) => {
          const address = profile.resolvedAddress?.id
          const displayName = beautifyName(profile.name)
          const isSelected = index === safeIndex
          return (
            <button
              key={profile.name}
              type='button'
              role='option'
              aria-selected={isSelected}
              onMouseEnter={() => onHoverIndex(index)}
              onClick={() => onSelect(profile.name)}
              className={cn(
                'relative flex w-full cursor-pointer items-center gap-3 p-2 text-left transition-all',
                isSelected ? 'bg-primary/10' : 'hover:bg-primary/5'
              )}
            >
              <Image
                src={`${ENS_METADATA_URL}/mainnet/header/${profile.name}`}
                alt={profile.name}
                width={500}
                height={200}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: 0.15,
                }}
                unoptimized={true}
              />
              <Avatar name={profile.name} style={{ width: '36px', height: '36px', borderRadius: '50%', zIndex: 10 }} />
              <div className='relative z-10 min-w-0 flex-1'>
                <p className='text-foreground truncate font-semibold'>{displayName}</p>
                {address && <p className='text-neutral truncate text-sm'>{formatAddress(address)}</p>}
              </div>
            </button>
          )
        })
      )}
    </div>
  )
}

export default MentionDropdown
