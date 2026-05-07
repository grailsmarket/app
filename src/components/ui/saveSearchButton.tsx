'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import StarIconOutline from 'public/icons/star-outline.svg'
import StarIconFilled from 'public/icons/star.svg'
import CrossIcon from 'public/icons/cross.svg'
import PencilIcon from 'public/icons/pencil.svg'
import CheckIcon from 'public/icons/check.svg'
import Tooltip from './tooltip'
import PrimaryButton from './buttons/primary'
import SecondaryButton from './buttons/secondary'
import ModalBackdrop from '@/components/modal/registration/components/modal-backdrop'
import useSavedSearches from '@/hooks/useSavedSearches'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import { SavedSearch } from '@/api/savedSearches/types'
import { cn } from '@/utils/tailwind'
import { NameFilters, SortFilterType } from '@/types/filters/name'
import { Trash } from 'ethereum-identity-kit'

// Tracks whether the default saved search has been auto-applied this session
let hasAutoAppliedDefault = false

const SaveSearchButton = () => {
  const { authStatus } = useUserContext()
  const { selectors, actions } = useFilterRouter()
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)

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

  const filters = selectors.filters as NameFilters

  // Auto-apply the default saved search only once
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
      ...((saved.filters as Partial<NameFilters>) ?? {}),
      search: saved.q ?? '',
      sort: sortValue,
    }

    dispatch(actions.setFilters(payload))
    setIsOpen(false)
  }

  const toggleDefault = (saved: SavedSearch) => {
    updateAsync({ ...saved, isDefault: !saved.isDefault })
  }

  const handleEditName = (saved: SavedSearch) => {
    setIsOpen(true)
    updateAsync({ ...saved, name: saved.name })
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
          className='border-foreground md:border-tertiary md:hover:bg-secondary flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-40 transition-all hover:opacity-100 disabled:opacity-20 disabled:hover:opacity-20 md:h-14 md:w-14 md:rounded-none md:border-0 md:border-l-2 md:opacity-50'
        >
          <Image
            src={StarIconOutline}
            alt='Saved searches'
            width={24}
            height={24}
            className='h-5 w-5 md:h-6 md:w-6'
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

          <div className='flex flex-col gap-1'>
            {isLoading ? (
              <p className='text-md py-4 text-center opacity-60'>Loading...</p>
            ) : savedSearches.length === 0 ? (
              <p className='text-md py-4 text-center opacity-60'>No saved searches yet.</p>
            ) : (
              <ul className='flex max-h-64 flex-col gap-2 overflow-y-auto'>
                {savedSearches.map((search, index) => (
                  <li
                    key={search.id}
                    onClick={() => editingSearch?.id === search.id ? undefined : applySavedSearch(search)}
                    className='border-tertiary hover:bg-secondary flex items-center gap-2 rounded-sm border p-2 transition-colors'
                  >
                    <button
                      className='flex flex-1 cursor-pointer items-center gap-2 text-left'
                    >
                      {editingSearch?.id === search.id ? (
                        <input
                          type='text'
                          value={editingSearch?.name ?? ''}
                          onChange={(e) => setEditingSearch({ ...editingSearch, name: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditName(editingSearch)
                              setEditingSearch(null)
                            }
                          }}
                          className='bg-secondary border-tertiary focus:border-primary rounded-sm border px-3 py-2 text-lg transition-colors focus:outline-none'
                        />
                      ) : (
                        <span className='truncate text-lg font-semibold'>{search.name}</span>
                      )}
                    </button>
                    {editingSearch?.id === search.id ? (
                      <div className='flex items-center gap-2'>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditName(editingSearch)
                            setEditingSearch(null)
                          }}
                          className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80'
                        >
                          <Image src={CheckIcon} alt='Close' width={14} height={14} className='h-4.5 w-4.5' />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSearch(null)
                          }}
                          className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80'
                        >
                          <Image src={CrossIcon} alt='Close' width={14} height={14} className='h-4.5 w-4.5' />
                        </button>
                      </div>
                    ) :
                      (<>
                        <Tooltip label={search.isDefault ? 'Unset default' : 'Set as default'} position={index === 0 ? 'bottom' : 'top'} align="right" padding={0}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleDefault(search)
                            }}
                            className={cn(
                              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80',
                              search.isDefault ? 'opacity-100' : 'opacity-40'
                            )}
                            aria-label='Toggle default'
                          >
                            <Image src={search.isDefault ? StarIconFilled : StarIconOutline} alt='Default' width={14} height={14} className='h-4.5 w-4.5' />
                          </button>
                        </Tooltip>
                        <Tooltip label='Edit Name' position={index === 0 ? 'bottom' : 'top'} align="right" padding={0}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSearch(search)
                            }}
                            className={cn(
                              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-all hover:opacity-80',
                              search.isDefault ? 'opacity-100' : 'opacity-40'
                            )}
                            aria-label='Toggle default'
                          >
                            <Image src={PencilIcon} alt='Default' width={14} height={14} className='h-4.5 w-4.5 invert' />
                          </button>
                        </Tooltip>
                        <Tooltip label='Delete' position={index === 0 ? 'bottom' : 'top'} align="right" padding={0}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemove(search)
                            }}
                            className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm opacity-60 transition-all hover:opacity-80'
                            aria-label='Delete saved search'
                          >
                            <Trash className='h-4.5 w-4.5 text-red-400' />
                          </button>
                        </Tooltip>
                      </>)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className='border-tertiary flex flex-col gap-3 border-t pt-lg'>
            <p className='text-xl font-bold px-md'>Save current search</p>
            <input
              type='text'
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='Name this search'
              maxLength={100}
              className='bg-secondary border-tertiary focus:border-primary rounded-sm border px-3 py-2 text-lg transition-colors focus:outline-none'
            />
            <label className='flex items-center justify-between p-md border-tertiary rounded-sm border gap-2 text-lg font-medium'>
              <div className='flex flex-col'>
                <p>Set as default</p>
                <p className='text-neutral text-sm'>Default search is applied automatically on this page</p>
              </div>
              <input
                type='checkbox'
                className='toggle'
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
              />
            </label>
            {errorMessage && <p className='text-sm text-red-400'>{errorMessage}</p>}
            <div className='flex flex-col items-center w-full gap-2'>
              <PrimaryButton
                onClick={handleSave}
                disabled={isCreating || newName.trim().length === 0}
                className='w-full'
              >
                {isCreating ? 'Saving...' : 'Save'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setIsOpen(false)} className='w-full'>Close</SecondaryButton>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </>
  )
}

export default SaveSearchButton
