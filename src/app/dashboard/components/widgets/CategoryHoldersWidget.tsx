'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectCategoryHoldersConfig } from '@/state/reducers/dashboard/selectors'
import { useHolders } from '@/app/categories/[category]/hooks/useHolders'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { useClickAway } from '@/hooks/useClickAway'
import HolderRow from '@/app/categories/[category]/components/holderRow'
import type { Holder } from '@/api/holders'
import LoadingCell from '@/components/ui/loadingCell'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'

interface CategoryHoldersWidgetProps {
  instanceId: string
}

const LoadingRow = () => (
  <div className='border-tertiary flex h-[60px] w-full items-center gap-3 border-b px-4'>
    <LoadingCell width='40px' height='40px' radius='50%' />
    <LoadingCell width='120px' height='20px' />
    <div className='flex-1' />
    <LoadingCell width='60px' height='20px' />
    <LoadingCell width='20px' height='20px' />
  </div>
)

const CategoryHoldersWidget: React.FC<CategoryHoldersWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectCategoryHoldersConfig(state, instanceId))
  const { categories } = useCategories()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryOpen(false)
  })

  const { holders, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useHolders(config?.category ?? '')

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const setCategory = useCallback(
    (category: string | null) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { category } }))
      setIsCategoryOpen(false)
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <div className='border-tertiary flex items-center border-b'>
        <div ref={categoryDropdownRef} className='relative w-full'>
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>{config.category ?? 'Select a category'}</p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isCategoryOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex max-h-64 w-full flex-col overflow-y-auto rounded-md border-2 shadow-lg'>
              {categories?.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{cat.name}</p>
                  {config.category === cat.name && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className='@container flex-1 overflow-y-auto'>
        {!config.category ? (
          <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
            Pick a category above to see its top holders.
          </div>
        ) : isLoading && holders.length === 0 ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingRow key={i} />
            ))}
          </div>
        ) : holders.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No holders found.</div>
        ) : (
          <div>
            {holders.map((holder, index) => (
              <HolderRow key={holder.address} holder={holder as Holder} category={config.category!} rank={index + 1} />
            ))}
            {isFetchingNextPage && Array.from({ length: 3 }).map((_, i) => <LoadingRow key={`next-${i}`} />)}
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryHoldersWidget
