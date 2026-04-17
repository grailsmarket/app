'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import StarIcon from 'public/icons/star.svg'
import CrossIcon from 'public/icons/cross.svg'
import CheckIcon from 'public/icons/check.svg'
import Tooltip from './tooltip'
import PrimaryButton from './buttons/primary'
import SecondaryButton from './buttons/secondary'
import ModalBackdrop from '@/components/modal/registration/components/modal-backdrop'
import useSavedSearches from '@/hooks/useSavedSearches'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import {
  loadMarketplaceFilters,
  MarketplaceFiltersState,
  SortFilterType,
} from '@/state/reducers/filters/marketplaceFilters'
import { SavedSearch } from '@/api/savedSearches/types'
import { cn } from '@/utils/tailwind'

// Tracks whether the default saved search has been auto-applied for this SPA
// session. Persists across component remounts (e.g. tab switches) so we only
// auto-apply once per hard page load.
let hasAutoAppliedDefault = false

const SaveSearchButton = () => {
  const { authStatus } = useUserContext()
  const { selectors } = useFilterRouter()
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)

  const {
    savedSearches,
    defaultSavedSearch,
    isLoading,
    canManageSavedSearches,
    createAsync,
    isCreating,
    createError,
    updateAsync,
    removeAsync,
  } = useSavedSearches()

  const filters = selectors.filters as MarketplaceFiltersState

  // Auto-apply the default saved search once per SPA session, when filters are
  // still at their empty defaults. Skips if the user already has filters set.
  useEffect(() => {
    if (hasAutoAppliedDefault || !defaultSavedSearch) return
    if (filters.search || filters.sort) return
    const savedFilters = (defaultSavedSearch.filters as Partial<MarketplaceFiltersState>) ?? {}
    const sortValue: SortFilterType | null = defaultSavedSearch.sortBy
      ? ((defaultSavedSearch.sortOrder
          ? `${defaultSavedSearch.sortBy}_${defaultSavedSearch.sortOrder}`
          : defaultSavedSearch.sortBy) as SortFilterType)
      : null
    console.log('[SaveSearch] auto-applying default', defaultSavedSearch)
    dispatch(
      loadMarketplaceFilters({
        ...savedFilters,
        search: defaultSavedSearch.q ?? '',
        sort: sortValue,
      })
    )
    hasAutoAppliedDefault = true
  }, [defaultSavedSearch, dispatch, filters.search, filters.sort])

  if (!canManageSavedSearches) return null

  const handleSave = async () => {
    const name = newName.trim()
    if (!name) return
    try {
      const { search, sort, ...rest } = filters
      const payload = {
        name,
        q: search || undefined,
        filters: rest,
        sortBy: sort ? (sort.replace('_asc', '').replace('_desc', '') as SortFilterType) : null,
        sortOrder: sort ? ((sort.includes('asc') ? 'asc' : 'desc') as 'asc' | 'desc') : null,
        isDefault: setAsDefault,
      }
      console.log('[SaveSearch] saving', payload)
      await createAsync(payload)
      setNewName('')
      setSetAsDefault(false)
    } catch {
      /* shown inline via createError */
    }
  }

  const applySavedSearch = (saved: SavedSearch) => {
    const sortValue: SortFilterType | null = saved.sortBy
      ? ((saved.sortOrder ? `${saved.sortBy}_${saved.sortOrder}` : saved.sortBy) as SortFilterType)
      : null

    const payload = {
      ...((saved.filters as Partial<MarketplaceFiltersState>) ?? {}),
      search: saved.q ?? '',
      sort: sortValue,
    }
    console.log('[SaveSearch] applying', { saved, payload })
    dispatch(loadMarketplaceFilters(payload))
    setIsOpen(false)
  }

  const toggleDefault = (saved: SavedSearch) => {
    updateAsync({ id: saved.id, isDefault: !saved.isDefault })
  }

  const handleRemove = (saved: SavedSearch) => {
    removeAsync(saved.id)
  }

  const errorMessage =
    createError?.code === 'DUPLICATE_SEARCH_NAME'
      ? 'A saved search with that name already exists.'
      : createError?.code === 'LIMIT_EXCEEDED'
        ? 'You have reached the saved search limit.'
        : createError
          ? 'Unable to save search. Please try again.'
          : null

  return (
    <>
      <Tooltip label='Saved searches' padding={0}>
        <button
          disabled={authStatus !== 'authenticated'}
          onClick={() => setIsOpen(true)}
          className='border-foreground md:border-tertiary md:hover:bg-secondary flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-40 transition-all hover:opacity-80 disabled:opacity-20 disabled:hover:opacity-20 md:h-14 md:w-14 md:rounded-none md:border-0 md:border-l-2 md:opacity-100'
        >
          <Image
            src={StarIcon}
            alt='Saved searches'
            width={24}
            height={24}
            className='h-5 w-5 md:h-6 md:w-6 md:opacity-50'
          />
        </button>
      </Tooltip>

      {isOpen && (
        <ModalBackdrop onClose={() => setIsOpen(false)}>
          <div className='flex items-center justify-between'>
            <h3 className='text-2xl font-bold'>Saved Searches</h3>
            <button
              onClick={() => setIsOpen(false)}
              className='hover:bg-secondary flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm transition-all'
              aria-label='Close'
            >
              <Image src={CrossIcon} alt='Close' width={16} height={16} className='h-4 w-4' />
            </button>
          </div>

          <div className='flex flex-col gap-2'>
            {isLoading ? (
              <p className='text-md py-4 text-center opacity-60'>Loading...</p>
            ) : savedSearches.length === 0 ? (
              <p className='text-md py-4 text-center opacity-60'>No saved searches yet.</p>
            ) : (
              <ul className='flex max-h-64 flex-col gap-1 overflow-y-auto'>
                {savedSearches.map((s) => (
                  <li
                    key={s.id}
                    className='border-tertiary hover:bg-secondary flex items-center gap-2 rounded-sm border p-2 transition-colors'
                  >
                    <button
                      onClick={() => applySavedSearch(s)}
                      className='flex flex-1 cursor-pointer items-center gap-2 text-left'
                    >
                      <span className='truncate text-lg font-semibold'>{s.name}</span>
                      {s.isDefault && (
                        <span className='bg-primary text-background rounded-sm px-1.5 py-0.5 text-xs font-bold'>
                          default
                        </span>
                      )}
                    </button>
                    <Tooltip label={s.isDefault ? 'Unset default' : 'Set as default'} padding={0}>
                      <button
                        onClick={() => toggleDefault(s)}
                        className={cn(
                          'flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80',
                          s.isDefault ? 'opacity-100' : 'opacity-40'
                        )}
                        aria-label='Toggle default'
                      >
                        <Image src={CheckIcon} alt='Default' width={14} height={14} className='h-3.5 w-3.5' />
                      </button>
                    </Tooltip>
                    <Tooltip label='Delete' padding={0}>
                      <button
                        onClick={() => handleRemove(s)}
                        className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm opacity-40 transition-all hover:opacity-80'
                        aria-label='Delete saved search'
                      >
                        <Image src={CrossIcon} alt='Delete' width={14} height={14} className='h-3.5 w-3.5' />
                      </button>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='border-tertiary mt-2 flex flex-col gap-3 border-t pt-4'>
            <p className='text-lg font-bold'>Save current search</p>
            <input
              type='text'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Name this search'
              maxLength={100}
              className='bg-secondary border-tertiary focus:border-primary rounded-sm border px-3 py-2 text-lg transition-colors focus:outline-none'
            />
            <label className='flex items-center gap-2 text-lg font-medium'>
              <input
                type='checkbox'
                className='toggle'
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
              />
              Set as default
            </label>
            {errorMessage && <p className='text-sm text-red-400'>{errorMessage}</p>}
            <div className='flex items-center gap-2'>
              <PrimaryButton
                onClick={handleSave}
                disabled={isCreating || newName.trim().length === 0}
                className='flex-1'
              >
                {isCreating ? 'Saving...' : 'Save'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsOpen(false)}>Close</SecondaryButton>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </>
  )
}

export default SaveSearchButton
