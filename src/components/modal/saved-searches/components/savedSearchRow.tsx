'use client'

import { useState } from 'react'
import Image from 'next/image'
import _ from 'lodash'
import { Trash } from 'ethereum-identity-kit'
import StarIconOutline from 'public/icons/star-outline.svg'
import StarIconFilled from 'public/icons/star.svg'
import CrossIcon from 'public/icons/cross.svg'
import PencilIcon from 'public/icons/pencil.svg'
import CheckIcon from 'public/icons/check.svg'
import Tooltip from '@/components/ui/tooltip'
import { SavedSearch } from '@/api/savedSearches/types'
import { NameFilters, SortFilterType } from '@/types/filters/name'
import { cn } from '@/utils/tailwind'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { useAppSelector } from '@/state/hooks'

interface SavedSearchRowProps {
  search: SavedSearch
  index: number
  onApply: (search: SavedSearch) => void
  onToggleDefault: (search: SavedSearch) => void
  onRename: (search: SavedSearch, name: string) => void
  onRemove: (search: SavedSearch) => void
}

export const matchMarketplaceFilters = (search: SavedSearch, filters: NameFilters) => {
  const savedSort: SortFilterType | null = search.sortBy
    ? ((search.sortOrder ? `${search.sortBy}_${search.sortOrder}` : search.sortBy) as SortFilterType)
    : null

  if ((filters.search ?? '') !== (search.q ?? '')) return false
  if (filters.sort !== savedSort) return false

  const currentRest = _.omit(filters, ['search', 'sort', 'open', 'scrollTop'])
  const savedRest = _.omit((search.filters as Partial<NameFilters>) ?? {}, ['open', 'scrollTop'])

  console.log(currentRest, savedRest)

  const matches = _.isEqual(currentRest, savedRest)
  return matches
}

const SavedSearchRow: React.FC<SavedSearchRowProps> = ({
  search,
  index,
  onApply,
  onToggleDefault,
  onRename,
  onRemove,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(search.name)

  const filters = useAppSelector(selectMarketplaceFilters)
  const isActive = matchMarketplaceFilters(search, filters)

  const beginEditing = () => {
    setDraftName(search.name)
    setIsEditing(true)
  }

  const commitEditing = () => {
    const trimmed = draftName.trim()
    if (trimmed && trimmed !== search.name) onRename(search, trimmed)
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setDraftName(search.name)
    setIsEditing(false)
  }

  const tooltipPosition = index === 0 ? 'bottom' : 'top'

  return (
    <li
      onClick={() => (isEditing ? undefined : onApply(search))}
      className='border-tertiary hover:bg-secondary flex cursor-pointer items-center gap-2 rounded-sm border p-2 transition-colors'
    >
      <span
        aria-label={isActive ? 'Currently applied' : 'Not applied'}
        className={cn(
          'border-tertiary flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border transition-colors',
          isActive ? 'border-primary bg-primary' : 'bg-background'
        )}
      >
        {isActive && <Image src={CheckIcon} alt='' width={12} height={12} className='h-3 w-3 invert' />}
      </span>

      <button className='flex flex-1 cursor-pointer items-center gap-2 text-left'>
        {isEditing ? (
          <input
            type='text'
            autoFocus
            value={draftName}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEditing()
              if (e.key === 'Escape') cancelEditing()
            }}
            className='bg-secondary border-tertiary focus:border-primary w-full rounded-sm border px-3 py-2 text-lg transition-colors focus:outline-none'
          />
        ) : (
          <span className='truncate text-lg font-semibold'>{search.name}</span>
        )}
      </button>

      {isEditing ? (
        <div className='flex items-center gap-2'>
          <button
            onClick={(e) => {
              e.stopPropagation()
              commitEditing()
            }}
            className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80'
            aria-label='Save name'
          >
            <Image src={CheckIcon} alt='' width={14} height={14} className='h-4.5 w-4.5' />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              cancelEditing()
            }}
            className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80'
            aria-label='Cancel rename'
          >
            <Image src={CrossIcon} alt='' width={14} height={14} className='h-4.5 w-4.5' />
          </button>
        </div>
      ) : (
        <>
          <Tooltip
            label={search.isDefault ? 'Unset default' : 'Set as default'}
            position={tooltipPosition}
            align='right'
            padding={0}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleDefault(search)
              }}
              className={cn(
                'flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80',
                search.isDefault ? 'opacity-100' : 'opacity-40'
              )}
              aria-label='Toggle default'
            >
              <Image
                src={search.isDefault ? StarIconFilled : StarIconOutline}
                alt=''
                width={14}
                height={14}
                className='h-4.5 w-4.5'
              />
            </button>
          </Tooltip>
          <Tooltip label='Edit name' position={tooltipPosition} align='right' padding={0}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                beginEditing()
              }}
              className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm opacity-40 transition-all hover:opacity-80'
              aria-label='Edit name'
            >
              <Image src={PencilIcon} alt='' width={14} height={14} className='h-4.5 w-4.5 invert' />
            </button>
          </Tooltip>
          <Tooltip label='Delete' position={tooltipPosition} align='right' padding={0}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(search)
              }}
              className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm opacity-60 transition-all hover:opacity-80'
              aria-label='Delete saved search'
            >
              <Trash className='h-4.5 w-4.5 text-red-400' />
            </button>
          </Tooltip>
        </>
      )}
    </li>
  )
}

export default SavedSearchRow
