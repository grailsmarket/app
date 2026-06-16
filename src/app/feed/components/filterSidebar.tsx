'use client'

import React from 'react'
import Image from 'next/image'
import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'
import type { ActivityTypeFilterType } from '@/types/filters/activity'
import FilterSelector from '@/components/filters/components/FilterSelector'
import { cn } from '@/utils/tailwind'
import FilterIcon from 'public/icons/filter.svg'
import CategoryMultiSelect from './categoryMultiSelect'
import { isAddress } from 'viem'
import { truncateAddress } from 'ethereum-identity-kit'
import { getMetadataAssetUrl } from '@/utils/web3/ens'
import { useNavbar } from '@/context/navbar'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import CloseIcon from 'public/icons/cross.svg'
import MobileFilterActions from '@/components/filters/components/MobileFilterActions'
import { useFiltersChanged } from '@/hooks/filters/useFiltersChanged'

export type FeedPlatformFilter = 'all' | 'grails' | 'opensea'

const PLATFORM_FILTERS: { label: string; value: FeedPlatformFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Grails', value: 'grails' },
  { label: 'Opensea', value: 'opensea' },
]

interface FilterSidebarProps {
  isOpen: boolean
  selectedTypes: ActivityTypeFilterType[]
  onToggleType: (type: ActivityTypeFilterType) => void
  activityTypeFilters?: readonly { label: string; value: ActivityTypeFilterType }[]
  showCommentFilters: boolean
  showActivityFilters: boolean
  ownerInput: string
  onOwnerInputChange: (value: string) => void
  ownerName?: string | null
  oppositeIdentifier?: string | null
  ownerError: string | null
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
  platform: FeedPlatformFilter
  onPlatformChange: (platform: FeedPlatformFilter) => void
  minPriceEth: string
  maxPriceEth: string
  onMinPriceEthChange: (value: string) => void
  onMaxPriceEthChange: (value: string) => void
  canClear: boolean
  onClear: () => void
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen,
  selectedTypes,
  onToggleType,
  activityTypeFilters = ACTIVITY_TYPE_FILTERS,
  showCommentFilters,
  showActivityFilters,
  ownerInput,
  onOwnerInputChange,
  ownerName,
  oppositeIdentifier,
  ownerError,
  selectedClubs,
  onSelectedClubsChange,
  platform,
  onPlatformChange,
  minPriceEth,
  maxPriceEth,
  onMinPriceEthChange,
  onMaxPriceEthChange,
  canClear,
  onClear,
}) => {
  const dispatch = useAppDispatch()
  const { actions } = useFilterRouter()
  const { isNavbarVisible } = useNavbar()
  const handlePriceChange = (value: string, onChange: (value: string) => void) => {
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) onChange(value)
  }

  // Enable "Apply" only once the filters changed since the panel was opened.
  const hasFilterChanges = useFiltersChanged(isOpen, {
    selectedTypes,
    selectedClubs,
    platform,
    ownerInput,
    minPriceEth,
    maxPriceEth,
  })

  const offsetClassName = isNavbarVisible ? 'md:top-[130px] top-[56px]' : 'md:top-[72px] top-[56px]'

  return (
    <aside
      className={cn(
        // Below 40rem container: full-screen fixed overlay. 40rem-64rem: fixed 292px overlay.
        'bg-background border-tertiary fixed bottom-0 left-0 z-40 flex w-[calc(100%-var(--chat-sidebar-width,0))] max-w-full flex-col overflow-y-scroll border-r-2 pb-2 shadow-md transition-transform duration-300 @[40rem]/app:w-[292px] @[40rem]/app:min-w-[292px]',
        // 64rem+ container: in-flow panel that pushes the feed content aside.
        // min-width must stay 0 so the width transition can animate open; shrink-0 keeps the open panel at full width.
        '@[64rem]/app:static @[64rem]/app:h-full @[64rem]/app:min-w-0 @[64rem]/app:shrink-0 @[64rem]/app:translate-x-0 @[64rem]/app:overflow-x-hidden @[64rem]/app:shadow-none @[64rem]/app:transition-[width]',
        isOpen ? 'translate-x-0' : 'translate-x-[-110%]',
        isOpen ? '@[64rem]/app:w-[292px]' : '@[64rem]/app:w-0 @[64rem]/app:overflow-hidden @[64rem]/app:border-r-0',
        offsetClassName
      )}
    >
      <div className='pt-md relative flex items-center justify-between'>
        <div className='px-lg py-md flex w-full min-w-full justify-between transition-transform @[64rem]/app:min-w-[292px]'>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={() => dispatch(actions.setFiltersOpen(false))}
              className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 @[48rem]/app:hidden @[48rem]/app:h-10 @[48rem]/app:w-10'
            >
              <Image src={CloseIcon} alt='Close' width={16} height={16} />
            </button>
            <div className='flex max-w-full items-center gap-1.5 pl-0.5 text-sm font-bold'>
              <Image src={FilterIcon} alt='filter icon' height={16} width={16} />
              <p className='text-light-800 text-xl leading-6 font-bold'>Filters</p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClear}
            disabled={!canClear}
            className='border-tertiary bg-tertiary text-md hover:bg-secondary h-9 cursor-pointer rounded-sm border px-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 @[48rem]/app:h-10'
          >
            Clear
          </button>
        </div>
      </div>
      <div className='bg-dark-700 flex h-fit flex-1 flex-col gap-2'>
        {(showCommentFilters || showActivityFilters) && (
          <div className='flex flex-col gap-4 p-3'>
            <div className='flex flex-col gap-2'>
              <p className='text-lg leading-[18px] font-medium'>Categories</p>
              <CategoryMultiSelect selectedClubs={selectedClubs} onSelectedClubsChange={onSelectedClubsChange} />
            </div>
            {showCommentFilters && (
              <div className='flex flex-col gap-2'>
                <p className='text-lg leading-[18px] font-medium'>Address</p>
                <input
                  value={ownerInput}
                  onChange={(e) => onOwnerInputChange(e.target.value)}
                  placeholder='Filter owner by ENS or address'
                  className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-full rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none'
                />
                {oppositeIdentifier && (
                  <div className='flex items-center gap-1.5'>
                    {ownerName && (
                      <Image
                        src={getMetadataAssetUrl(ownerName, 'avatar')}
                        alt={ownerName ?? ''}
                        width={26}
                        height={26}
                        className='h-6.5 w-6.5 rounded-full'
                      />
                    )}
                    <p className={cn('text-md font-medium', ownerError && 'text-red-400')}>
                      {isAddress(oppositeIdentifier) ? truncateAddress(oppositeIdentifier) : ownerName || ownerError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {showActivityFilters && (
          <>
            <div className='flex flex-col gap-2'>
              <p className='px-3 text-lg leading-[18px] font-medium'>Platform</p>
              <div className='flex flex-col overflow-x-hidden'>
                {PLATFORM_FILTERS.map((item) => {
                  const isSelected = platform === item.value

                  return (
                    <div
                      key={item.value}
                      onClick={() => onPlatformChange(item.value)}
                      className='hover:bg-secondary flex cursor-pointer items-center justify-between rounded-sm p-3'
                    >
                      <p className='text-md font-medium'>{item.label}</p>
                      <FilterSelector isActive={isSelected} isRadio onClick={() => onPlatformChange(item.value)} />
                    </div>
                  )
                })}
              </div>
            </div>
            <div className='flex flex-col gap-2 p-3'>
              <p className='text-lg leading-[18px] font-medium'>Price</p>
              <div className='flex gap-2'>
                <input
                  type='text'
                  inputMode='decimal'
                  value={minPriceEth}
                  onChange={(e) => handlePriceChange(e.target.value, onMinPriceEthChange)}
                  placeholder='Min ETH'
                  className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-1/2 rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none'
                />
                <input
                  type='text'
                  inputMode='decimal'
                  value={maxPriceEth}
                  onChange={(e) => handlePriceChange(e.target.value, onMaxPriceEthChange)}
                  placeholder='Max ETH'
                  className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-1/2 rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none'
                />
              </div>
            </div>
            <div className='w-full p-3 pb-2'>
              <div className='flex w-full flex-col gap-3'>
                <p className='text-lg leading-[18px] font-medium'>Type</p>
              </div>
            </div>
            <div className='flex flex-col overflow-x-hidden'>
              {activityTypeFilters.map((item) => {
                const isSelected = selectedTypes.includes(item.value)

                return (
                  <div
                    key={item.value}
                    onClick={() => onToggleType(item.value)}
                    className='hover:bg-secondary flex cursor-pointer items-center justify-between rounded-sm p-3'
                  >
                    <p className='text-md font-medium'>{item.label}</p>
                    <FilterSelector isActive={isSelected} onClick={() => onToggleType(item.value)} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <MobileFilterActions
        position='sticky'
        className='@[64rem]/app:hidden'
        canApply={hasFilterChanges}
        onClose={() => dispatch(actions.setFiltersOpen(false))}
        onApply={() => dispatch(actions.setFiltersOpen(false))}
      />
    </aside>
  )
}

export default FilterSidebar
