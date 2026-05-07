'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import StarIconOutline from 'public/icons/star-outline.svg'
import StarIconFilled from 'public/icons/star.svg'
import Tooltip from './tooltip'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import useSavedSearches from '@/hooks/useSavedSearches'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectSavedSearchesModal, setSavedSearchesModalOpen } from '@/state/reducers/modals/savedSearchesModal'
import { NameFilters, SortFilterType } from '@/types/filters/name'
import { cn } from '@/utils/tailwind'

// Tracks whether the default saved search has been auto-applied this session
let hasAutoAppliedDefault = false

const SaveSearchButton = () => {
  const { authStatus } = useUserContext()
  const { selectors, actions } = useFilterRouter()
  const dispatch = useAppDispatch()
  const { defaultSavedSearch, canManageSavedSearches } = useSavedSearches()
  const { savedSearchActive } = useAppSelector(selectSavedSearchesModal)

  console.log('savedSearchActive', savedSearchActive)

  const filters = selectors.filters as NameFilters

  // Auto-apply the default saved search once per session, only when the user
  // hasn't already typed a search query or chosen a sort.
  useEffect(() => {
    if (hasAutoAppliedDefault || !defaultSavedSearch) return
    if (filters.search || filters.sort) return

    const savedFilters = (defaultSavedSearch.filters as Partial<NameFilters>) ?? {}
    const sortValue: SortFilterType | null = defaultSavedSearch.sortBy
      ? ((defaultSavedSearch.sortOrder
          ? `${defaultSavedSearch.sortBy}_${defaultSavedSearch.sortOrder}`
          : defaultSavedSearch.sortBy) as SortFilterType)
      : null

    dispatch(
      actions.setFilters({
        ...savedFilters,
        search: defaultSavedSearch.q ?? '',
        sort: sortValue,
      })
    )

    hasAutoAppliedDefault = true
  }, [defaultSavedSearch, dispatch, filters.search, filters.sort, actions])

  if (!canManageSavedSearches) return null

  return (
    <Tooltip label='Saved searches' padding={0}>
      <button
        disabled={authStatus !== 'authenticated'}
        onClick={() => dispatch(setSavedSearchesModalOpen(true))}
        className={cn(
          'border-foreground md:border-tertiary md:hover:bg-secondary flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-40 transition-all hover:opacity-100 disabled:opacity-20 disabled:hover:opacity-20 md:h-14 md:w-14 md:rounded-none md:border-0 md:border-l-2 md:opacity-50',
          savedSearchActive ? 'opacity-100!' : 'opacity-40'
        )}
        aria-label='Saved searches'
      >
        <Image
          src={savedSearchActive ? StarIconFilled : StarIconOutline}
          alt='Saved searches'
          width={24}
          height={24}
          className='h-5 w-5 md:h-6 md:w-6'
        />
      </button>
    </Tooltip>
  )
}

export default SaveSearchButton
