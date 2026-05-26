'use client'

import { useState } from 'react'
import Image from 'next/image'
import CrossIcon from 'public/icons/cross.svg'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import ModalBackdrop from '@/components/modal/registration/components/modal-backdrop'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectSavedSearchesModal, setSavedSearchesModalOpen } from '@/state/reducers/modals/savedSearchesModal'
import useSavedSearches from '@/hooks/useSavedSearches'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { SavedSearch } from '@/api/savedSearches/types'
import { NameFilters, SortFilterType } from '@/types/filters/name'
import SavedSearchRow from './components/savedSearchRow'

const splitSort = (sort: SortFilterType | null) => ({
  sortBy: sort ? (sort.replace('_asc', '').replace('_desc', '') as SortFilterType) : null,
  sortOrder: sort ? ((sort.includes('asc') ? 'asc' : 'desc') as 'asc' | 'desc') : null,
})

const buildSortFromSaved = (saved: SavedSearch): SortFilterType | null =>
  saved.sortBy ? ((saved.sortOrder ? `${saved.sortBy}_${saved.sortOrder}` : saved.sortBy) as SortFilterType) : null

const SavedSearchesModal = () => {
  const dispatch = useAppDispatch()
  const { open } = useAppSelector(selectSavedSearchesModal)
  const { selectors, actions } = useFilterRouter()
  const filters = selectors.filters as NameFilters

  const [newName, setNewName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)

  const { savedSearches, isLoading, createAsync, isCreating, createError, updateAsync, removeAsync } =
    useSavedSearches()

  if (!open) return null

  const close = () => dispatch(setSavedSearchesModalOpen(false))

  const handleSave = async () => {
    const name = newName.trim()
    if (!name) return

    const { search, sort, ...rest } = filters
    try {
      await createAsync({
        name,
        q: search || undefined,
        filters: rest,
        ...splitSort(sort),
        isDefault: setAsDefault,
      })
      setNewName('')
      setSetAsDefault(false)
    } catch {
      /* surfaced inline via createError */
    }
  }

  const applySavedSearch = (saved: SavedSearch) => {
    dispatch(
      actions.setFilters({
        ...((saved.filters as Partial<NameFilters>) ?? {}),
        search: saved.q ?? '',
        sort: buildSortFromSaved(saved),
      })
    )
    close()
  }

  const toggleDefault = (saved: SavedSearch) => {
    updateAsync({ ...saved, isDefault: !saved.isDefault })
  }

  const renameSaved = (saved: SavedSearch, name: string) => {
    updateAsync({ ...saved, name })
  }

  const removeSaved = (saved: SavedSearch) => {
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
    <ModalBackdrop onClose={close}>
      <div className='flex items-center justify-between'>
        <h3 className='text-2xl font-bold'>Saved Searches</h3>
        <button
          onClick={close}
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
              <SavedSearchRow
                key={search.id}
                search={search}
                index={index}
                onApply={applySavedSearch}
                onToggleDefault={toggleDefault}
                onRename={renameSaved}
                onRemove={removeSaved}
              />
            ))}
          </ul>
        )}
      </div>

      <div className='border-tertiary pt-lg flex flex-col gap-3 border-t'>
        <p className='px-md text-xl font-bold'>Save current search</p>
        <input
          type='text'
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder='Name this search'
          maxLength={100}
          className='bg-secondary border-tertiary focus:border-primary rounded-sm border px-3 py-2 text-lg transition-colors focus:outline-none'
        />
        <label className='p-md border-tertiary flex items-center justify-between gap-2 rounded-sm border text-lg font-medium'>
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
        <div className='flex w-full flex-col items-center gap-2'>
          <PrimaryButton onClick={handleSave} disabled={isCreating || newName.trim().length === 0} className='w-full'>
            {isCreating ? 'Saving...' : 'Save'}
          </PrimaryButton>
          <SecondaryButton onClick={close} className='w-full'>
            Close
          </SecondaryButton>
        </div>
      </div>
    </ModalBackdrop>
  )
}

export default SavedSearchesModal
