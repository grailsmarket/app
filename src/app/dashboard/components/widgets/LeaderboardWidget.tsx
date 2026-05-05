'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectLeaderboardConfig } from '@/state/reducers/dashboard/selectors'
import { useLeaderboard } from '@/app/leaderboard/hooks/useLeaderboard'
import type { LeaderboardSortBy, LeaderboardSortOrder, LeaderboardUser } from '@/types/leaderboard'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import Image from 'next/image'
import ascending from 'public/icons/ascending.svg'
import descending from 'public/icons/descending.svg'
import { useClickAway } from '@/hooks/useClickAway'
import LeaderboardRow from '@/app/leaderboard/components/LeaderboardRow'

const SORT_OPTIONS: { value: LeaderboardSortBy; label: string }[] = [
  { value: 'names_owned', label: 'Names' },
  { value: 'names_in_clubs', label: 'In Categories' },
  { value: 'names_listed', label: 'Listings' },
  { value: 'names_sold', label: 'Sales' },
  { value: 'sales_volume', label: 'Volume' },
]

interface LeaderboardWidgetProps {
  instanceId: string
}

const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectLeaderboardConfig(state, instanceId))
  const [isSortOpen, setIsSortOpen] = useState(false)

  const sortDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsSortOpen(false)
  })

  const { users, isLoading } = useLeaderboard({
    sortBy: config?.sortBy,
    sortOrder: config?.sortOrder,
    clubs: config?.clubs,
  })

  const handleSortChange = useCallback(
    (sortBy: LeaderboardSortBy) => {
      if (!config) return
      dispatch(updateComponentConfig({ id: instanceId, patch: { sortBy } }))
      setIsSortOpen(false)
    },
    [dispatch, instanceId, config]
  )

  const handleToggleDirection = useCallback(() => {
    if (!config) return
    const sortOrder: LeaderboardSortOrder = config.sortOrder === 'desc' ? 'asc' : 'desc'
    dispatch(updateComponentConfig({ id: instanceId, patch: { sortOrder } }))
  }, [dispatch, instanceId, config])

  const displayedUsers = useMemo(() => users?.slice(0, 50) ?? [], [users])

  if (!config) return null

  const currentSortLabel = SORT_OPTIONS.find((opt) => opt.value === config.sortBy)?.label ?? config.sortBy

  return (
    <div className='flex h-full flex-col'>
      {/* Sort control */}
      <div className='border-tertiary flex items-center border-b'>
        <div className='relative flex-1' ref={sortDropdownRef}>
          <button
            onClick={() => setIsSortOpen(!isSortOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>{currentSortLabel}</p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isSortOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isSortOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex w-full flex-col rounded-md border-2 shadow-lg'>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{opt.label}</p>
                  {config.sortBy === opt.value && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleToggleDirection}
          className='border-tertiary hover:bg-secondary flex h-10 w-10 min-w-10 cursor-pointer items-center justify-center border-l transition-colors'
        >
          <Image
            src={config.sortOrder === 'asc' ? ascending : descending}
            alt={config.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            width={24}
            height={24}
          />
        </button>
      </div>

      {/* Content */}
      <div className='@container flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No data</div>
        ) : (
          displayedUsers.map((user, i) => (
            <LeaderboardRow
              key={user.address}
              user={user as unknown as LeaderboardUser}
              rank={i + 1}
              sortBy={config.sortBy}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default LeaderboardWidget
