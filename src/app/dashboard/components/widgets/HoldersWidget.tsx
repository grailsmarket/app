'use client'

import React, { useCallback, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectHoldersConfig } from '@/state/reducers/dashboard/selectors'
import { fetchHolders, fetchAllHolders } from '@/api/holders'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { cn } from '@/utils/tailwind'

interface HoldersWidgetProps {
  instanceId: string
}

const HoldersWidget: React.FC<HoldersWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectHoldersConfig(state, instanceId))
  const { categories } = useCategories()

  const isAll = !config?.categories?.length

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ['dashboard', 'holders', instanceId, config?.categories],
    queryFn: async ({ pageParam = 1 }) => {
      if (isAll) {
        return fetchAllHolders({ page: pageParam, limit: 50 })
      }
      // For single category selection
      return fetchHolders({ category: config!.categories[0], page: pageParam, limit: 50 })
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.pagination) return undefined
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    enabled: !!config,
  })

  const holders = useMemo(() => {
    return data?.pages?.flatMap((page: any) => page?.data?.holders ?? page?.holders ?? []) ?? []
  }, [data])

  const toggleCategory = useCallback(
    (category: string) => {
      if (!config) return
      if (category === 'all') {
        dispatch(updateComponentConfig({ id: instanceId, patch: { categories: [] } }))
        return
      }
      const current = config.categories
      const next = current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
      dispatch(updateComponentConfig({ id: instanceId, patch: { categories: next } }))
    },
    [dispatch, instanceId, config]
  )

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      {/* Category selector */}
      <div className='border-tertiary flex flex-wrap gap-1 border-b px-3 py-2'>
        <button
          onClick={() => toggleCategory('all')}
          className={cn(
            'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
            isAll ? 'bg-primary text-background' : 'text-neutral hover:bg-white/10 hover:text-white'
          )}
        >
          All
        </button>
        {categories?.slice(0, 10).map((cat: any) => (
          <button
            key={cat.name ?? cat}
            onClick={() => toggleCategory(cat.name ?? cat)}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
              config.categories.includes(cat.name ?? cat)
                ? 'bg-primary text-background'
                : 'text-neutral hover:bg-white/10 hover:text-white'
            )}
          >
            {cat.name ?? cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : holders.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No holders</div>
        ) : (
          <div className='divide-tertiary divide-y'>
            {holders.map((holder: any, i: number) => (
              <div key={holder.address} className='flex items-center gap-3 px-3 py-2 text-sm'>
                <span className='text-neutral w-5 shrink-0 text-right text-xs'>{i + 1}</span>
                <span className='min-w-0 flex-1 truncate font-mono text-xs'>
                  {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                </span>
                <span className='text-neutral shrink-0 text-xs'>{holder.name_count} names</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HoldersWidget
