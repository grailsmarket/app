'use client'

import React, { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectLeaderboardConfig } from '@/state/reducers/dashboard/selectors'
import { useLeaderboard } from '@/app/leaderboard/hooks/useLeaderboard'
import type { LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import { cn } from '@/utils/tailwind'

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

  const { users, isLoading } = useLeaderboard({
    sortBy: config?.sortBy,
    sortOrder: config?.sortOrder,
    clubs: config?.clubs,
  })

  const handleSortChange = useCallback(
    (sortBy: LeaderboardSortBy) => {
      if (!config) return
      const sortOrder: LeaderboardSortOrder = config.sortBy === sortBy && config.sortOrder === 'desc' ? 'asc' : 'desc'
      dispatch(updateComponentConfig({ id: instanceId, patch: { sortBy, sortOrder } }))
    },
    [dispatch, instanceId, config]
  )

  const displayedUsers = useMemo(() => users?.slice(0, 50) ?? [], [users])

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      {/* Sort controls */}
      <div className='border-tertiary flex flex-wrap items-center gap-1 border-b px-3 py-2'>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSortChange(opt.value)}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
              config.sortBy === opt.value
                ? 'bg-primary text-background'
                : 'text-neutral hover:bg-white/10 hover:text-white'
            )}
          >
            {opt.label}
            {config.sortBy === opt.value && <span className='ml-0.5'>{config.sortOrder === 'asc' ? '↑' : '↓'}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : displayedUsers.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No data</div>
        ) : (
          <div className='divide-tertiary divide-y'>
            {displayedUsers.map((user, i) => {
              const sortValue =
                config.sortBy === 'sales_volume'
                  ? `${(Number(user.sales_volume) / 1e18).toFixed(2)} ETH`
                  : String(user[config.sortBy])

              return (
                <div key={user.address} className='flex items-center gap-3 px-3 py-2 text-sm'>
                  <span className='text-neutral w-5 shrink-0 text-right text-xs'>{i + 1}</span>
                  <span className='min-w-0 flex-1 truncate font-mono text-xs'>
                    {user.address.slice(0, 6)}...{user.address.slice(-4)}
                  </span>
                  <span className='text-neutral shrink-0 text-xs'>{sortValue}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardWidget
