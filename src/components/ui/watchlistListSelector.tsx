import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import { useClickAway } from '@/hooks/useClickAway'
import useWatchlists from '@/hooks/useWatchlists'
import ArrowDown from 'public/icons/arrow-down.svg'
import PlusIcon from 'public/icons/plus-primary.svg'
import Star from 'public/icons/star.svg'
import { Cross, Pencil, Trash } from 'ethereum-identity-kit'
import PrimaryButton from './buttons/primary'
import Input from './input'
import Tooltip from './tooltip'
import LoadingCell from './loadingCell'

type ModalType = 'new' | 'edit' | 'delete'

const WatchlistListSelector: React.FC = () => {
  const {
    lists,
    selectedList,
    selectList,
    isLoading,
    canManageLists,
    createListAsync,
    editListAsync,
    deleteListAsync,
  } = useWatchlists()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<ModalType>('new')
  const [modalName, setModalName] = useState('')
  const [modalIsDefault, setModalIsDefault] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dropdownRef = useClickAway<HTMLDivElement>(() => setDropdownOpen(false))

  const selectedListName = useMemo(() => selectedList?.name ?? 'Watchlist', [selectedList])

  const canEditSelected = selectedList != null && !selectedList.isDefault && canManageLists
  const canDeleteSelected = selectedList != null && !selectedList.isDefault && canManageLists

  const openModal = (type: ModalType) => {
    setModalType(type)
    setModalError(null)

    if (type === 'edit' && selectedList) {
      setModalName(selectedList.name)
      setModalIsDefault(selectedList.isDefault)
    } else {
      setModalName('')
      setModalIsDefault(false)
    }

    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalName('')
    setModalIsDefault(false)
    setModalError(null)
  }

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setModalError(null)

    try {
      if (modalType === 'delete' && selectedList) {
        await deleteListAsync(selectedList.id)
      } else if (modalType === 'new') {
        const trimmed = modalName.trim()
        if (!trimmed) {
          setModalError('Name is required')
          setIsSubmitting(false)
          return
        }
        const newList = await createListAsync(trimmed)
        if (modalIsDefault) {
          await editListAsync({ listId: newList.id, isDefault: true })
        }
        selectList(newList.id)
      } else if (modalType === 'edit' && selectedList) {
        const trimmed = modalName.trim()
        if (!trimmed) {
          setModalError('Name is required')
          setIsSubmitting(false)
          return
        }
        await editListAsync({
          listId: selectedList.id,
          name: trimmed !== selectedList.name ? trimmed : undefined,
          isDefault: modalIsDefault !== selectedList.isDefault ? modalIsDefault : undefined,
        })
      }
      closeModal()
    } catch (error: any) {
      const code = error?.code
      if (code === 'DUPLICATE_LIST_NAME') {
        setModalError('A list with this name already exists')
      } else if (code === 'LIST_LIMIT_REACHED') {
        setModalError('Maximum number of lists reached (20)')
      } else if (code === 'CANNOT_DELETE_DEFAULT') {
        setModalError('Cannot delete the default watchlist')
      } else if (code === 'CANNOT_RENAME_DEFAULT') {
        setModalError('Cannot rename the default watchlist')
      } else {
        setModalError(error?.message ?? 'Something went wrong')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (lists.length <= 1 && !canManageLists) return null

  return (
    <>
      <div className='py-md flex flex-row items-center gap-2 px-3'>
        <div className='relative z-50' ref={dropdownRef as React.RefObject<HTMLDivElement>}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className='border-tertiary px-md hover:bg-secondary flex h-10 w-56 cursor-pointer items-center justify-between rounded-md border transition-colors'
          >
            {isLoading ? (
              <LoadingCell height='24px' width='100px' radius='4px' />
            ) : (
              <p className='truncate text-lg font-medium'>{selectedListName}</p>
            )}
            <Image
              src={ArrowDown}
              alt='Dropdown arrow'
              height={12}
              width={12}
              className={cn('shrink-0 transition-transform', dropdownOpen && 'rotate-180')}
            />
          </button>
          {dropdownOpen && (
            <div className='bg-background border-tertiary absolute top-12 left-0 w-full rounded-md border shadow-md'>
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={cn(
                    'px-lg hover:bg-secondary flex cursor-pointer flex-row items-center justify-between gap-2 py-3 transition-colors',
                    selectedList?.id === list.id && 'bg-secondary'
                  )}
                  onClick={() => {
                    selectList(list.id)
                    setDropdownOpen(false)
                  }}
                >
                  <p className='max-w-[120px] truncate'>{list.name}</p>
                  <div className='flex items-center gap-1.5'>
                    <span className='text-neutral text-sm'>{list.itemCount}</span>
                    {list.isDefault && (
                      <Tooltip label='Default watchlist' position='top' align='right'>
                        <Image src={Star} alt='Default' className='h-4 w-4' height={16} width={16} />
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {canEditSelected && (
          <Tooltip label='Edit watchlist' position='top' align='center'>
            <button
              onClick={() => openModal('edit')}
              className='border-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-2 p-1 opacity-80 transition-opacity hover:opacity-100'
            >
              <Pencil className='text-foreground h-5 w-5' />
            </button>
          </Tooltip>
        )}
        {canManageLists && (
          <Tooltip label='New watchlist' position='top' align='center'>
            <button
              onClick={() => openModal('new')}
              className='border-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-2 transition-opacity hover:opacity-80'
            >
              <Image src={PlusIcon} alt='New watchlist' width={20} height={20} />
            </button>
          </Tooltip>
        )}
        {canDeleteSelected && (
          <Tooltip label='Delete watchlist' position='top' align='center'>
            <button
              onClick={() => openModal('delete')}
              className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border-2 border-red-400 p-1 transition-opacity hover:opacity-80'
            >
              <Trash className='h-4.5 w-4.5 text-red-400' />
            </button>
          </Tooltip>
        )}
      </div>

      {modalOpen &&
        createPortal(
          <div
            className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-sm'
            onClick={closeModal}
          >
            <div
              className='bg-background border-tertiary relative flex w-full max-w-md flex-col gap-2 rounded-md border p-4 shadow-md'
              onClick={(e) => e.stopPropagation()}
            >
              <Cross className='absolute top-3 right-3 h-3 w-3 cursor-pointer text-white' onClick={closeModal} />
              <h2 className='text-center text-2xl font-bold'>
                {modalType === 'delete'
                  ? 'Delete Watchlist'
                  : modalType === 'edit'
                    ? 'Edit Watchlist'
                    : 'New Watchlist'}
              </h2>

              {modalType === 'delete' ? (
                <p className='py-2 text-center text-lg font-medium'>
                  Are you sure you want to delete &ldquo;{selectedList?.name}&rdquo;? All entries in this list will be
                  removed.
                </p>
              ) : (
                <>
                  <Input
                    label='Name'
                    type='text'
                    placeholder='My Watchlist'
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    className='w-full'
                  />
                  <div className='p-md border-tertiary flex items-center justify-between rounded-md border'>
                    <div className='flex flex-col'>
                      <p className='text-lg font-medium'>Set as default</p>
                      <p className='text-neutral text-sm'>New names will be added to this list by default.</p>
                    </div>
                    <button
                      type='button'
                      onClick={() => setModalIsDefault(!modalIsDefault)}
                      className={cn(
                        'group relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
                        modalIsDefault ? 'bg-primary' : 'bg-tertiary'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-200',
                          modalIsDefault ? 'translate-x-5' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </>
              )}

              {modalError && <p className='text-sm text-red-400'>{modalError}</p>}

              <PrimaryButton onClick={handleConfirm} disabled={isSubmitting} className='w-full'>
                {modalError ? 'Try Again' : 'Confirm'}
              </PrimaryButton>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default WatchlistListSelector
