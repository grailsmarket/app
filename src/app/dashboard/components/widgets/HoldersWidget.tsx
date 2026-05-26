'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectHoldersConfig } from '@/state/reducers/dashboard/selectors'
import { fetchHolders, fetchAllHolders, type Holder } from '@/api/holders'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'
import HolderRow from '@/app/categories/[category]/components/holderRow'

interface HoldersWidgetProps {
  instanceId: string
}

const HoldersWidget: React.FC<HoldersWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectHoldersConfig(state, instanceId))
  const { categories } = useCategories()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryOpen(false)
  })

  const isAll = !config?.categories?.length

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ['dashboard', 'holders', instanceId, config?.categories],
    queryFn: async ({ pageParam = 1 }) => {
      if (isAll) {
        return fetchAllHolders({ page: pageParam, limit: 50 })
      }
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
        setIsCategoryOpen(false)
        return
      }
      const current = config.categories
      const next = current.includes(category) ? current.filter((c) => c !== category) : [...current, category]
      dispatch(updateComponentConfig({ id: instanceId, patch: { categories: next } }))
    },
    [dispatch, instanceId, config]
  )

  if (!config) return null

  const categoryLabel = isAll
    ? 'All Categories'
    : config.categories.length === 1
      ? config.categories[0]
      : `${config.categories.length} categories`

  return (
    <div className='flex h-full flex-col'>
      {/* Category selector */}
      <div className='border-tertiary flex items-center border-b'>
        <div ref={categoryDropdownRef as React.RefObject<HTMLDivElement>} className='relative w-full'>
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>{categoryLabel}</p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isCategoryOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex max-h-64 w-full flex-col overflow-y-auto rounded-md border-2 shadow-lg'>
              <button
                onClick={() => toggleCategory('all')}
                className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
              >
                <p>All Categories</p>
                {isAll && <Check className='text-primary h-4 w-4' />}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{cat.name}</p>
                  {config.categories.includes(cat.name) && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='@container flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : holders.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No holders</div>
        ) : (
          (holders as Holder[]).map((holder, i) => (
            <HolderRow key={holder.address} holder={holder} category={config.categories[0] ?? ''} rank={i + 1} />
          ))
        )}
      </div>
    </div>
  )
}

export default HoldersWidget
