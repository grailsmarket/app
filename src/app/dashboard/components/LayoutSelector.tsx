import React, { useMemo, useState } from 'react'
import { useDashboardSync } from '../hooks/useDashboardSync'
import LoadingCell from '@/components/ui/loadingCell'
import Image from 'next/image'
import ArrowDown from 'public/icons/arrow-down.svg'
import { useClickAway } from '@/hooks/useClickAway'
import { useAppDispatch } from '@/state/hooks'
import { resetDashboard } from '@/state/reducers/dashboard'
import { cn } from '@/utils/tailwind'
import PrimaryButton from '@/components/ui/buttons/primary'
import { Cross, Pencil, Trash } from 'ethereum-identity-kit'
import Input from '@/components/ui/input'
import Star from 'public/icons/star.svg'
import Tooltip from '@/components/ui/tooltip'

const LayoutSelector = () => {
  const dispatch = useAppDispatch()
  const { layouts, isLoadingLayouts, loadLayout, removeLayout, saveLayout, selectedLayoutId, setSelectedLayoutId } =
    useDashboardSync()

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [confirmationDialogType, setConfirmationDialogType] = useState<'delete' | 'edit' | 'new'>('new')
  const [confirmationDialogName, setConfirmationDialogName] = useState('')
  const [confirmationDialogIsDefaultLayout, setConfirmationDialogIsDefaultLayout] = useState(false)
  const [confirmationDialogError, setConfirmationDialogError] = useState<string | null>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const menuRef = useClickAway<HTMLDivElement>(() => setMenuOpen(false))
  const dropdownRef = useClickAway<HTMLDivElement>(() => setDropdownOpen(false))
  const selectedLayoutName = useMemo(() => {
    return selectedLayoutId === null ? 'New Layout' : layouts?.find((layout) => layout.id === selectedLayoutId)?.name
  }, [selectedLayoutId, layouts])

  const handleConfirmationDialogOpen = (type: 'delete' | 'edit' | 'new') => {
    setConfirmationDialogType(type)
    setConfirmationDialogOpen(true)

    if (type === 'edit') {
      setConfirmationDialogName(selectedLayoutName || '')
      setConfirmationDialogIsDefaultLayout(
        layouts?.find((layout) => layout.id === selectedLayoutId)?.isDefault || false
      )
    } else {
      setConfirmationDialogName('')
    }
  }

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false)
    setConfirmationDialogType('new')
    setConfirmationDialogName('')
  }

  const handleConfirmationDialogConfirm = async () => {
    if (confirmationDialogType === 'delete') {
      const response = await removeLayout()
      if (response.success) {
        handleConfirmationDialogClose()
      } else {
        setConfirmationDialogError(response.message as string)
      }
    } else if (confirmationDialogType === 'edit' || confirmationDialogType === 'new') {
      const response = await saveLayout(confirmationDialogName, confirmationDialogIsDefaultLayout)
      if (response.success) {
        handleConfirmationDialogClose()
      } else {
        setConfirmationDialogError(response.message as string)
      }
    }
  }

  return (
    <>
      <div className='flex flex-row gap-2'>
        <div className='relative z-30' ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className='border-tertiary px-md hover:bg-secondary z-50 flex h-10 w-56 cursor-pointer items-center justify-between rounded-md border transition-colors'
          >
            {isLoadingLayouts ? (
              <LoadingCell height='24px' width='100px' radius='4px' />
            ) : (
              <p className='text-lg font-medium'>{selectedLayoutName || `Layout #${selectedLayoutName}`}</p>
            )}
            <Image
              src={ArrowDown}
              alt='Dropdown arrow'
              height={12}
              width={12}
              className={cn('transition-transform', dropdownOpen && 'rotate-180')}
            />
          </button>
          {dropdownOpen && (
            <div className='bg-background border-tertiary absolute top-12 left-0 w-full rounded-md border shadow-md'>
              {layouts?.map((layout) => (
                <div
                  key={layout.id}
                  className='px-lg hover:bg-secondary flex cursor-pointer flex-row items-center justify-between py-3 transition-colors'
                  onClick={() => {
                    setSelectedLayoutId(layout.id)

                    const newLayout = layouts.find((item) => item.id === layout.id)
                    if (newLayout) loadLayout(newLayout)

                    setDropdownOpen(false)
                  }}
                >
                  <p className='max-w-[164px] text-wrap wrap-anywhere'>{layout.name}</p>
                  {layout.isDefault && (
                    <Tooltip label='Default layout' position='top' align='right'>
                      <Image src={Star} alt='Default' className='h-4 w-4' height={16} width={16} />
                    </Tooltip>
                  )}
                </div>
              ))}
              <div
                key='new-layout'
                onClick={() => {
                  setSelectedLayoutId(null)
                  dispatch(resetDashboard())
                  setDropdownOpen(false)
                }}
                className='px-lg hover:bg-secondary cursor-pointer py-3 transition-colors'
              >
                <p>New Layout</p>
              </div>
            </div>
          )}
        </div>
        {selectedLayoutName === 'New Layout' ? (
          <PrimaryButton
            className='h-10'
            onClick={() => {
              handleConfirmationDialogOpen('new')
            }}
          >
            Save
          </PrimaryButton>
        ) : (
          <div className='relative' ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className='border-tertiary hover:border-foreground/50 flex h-10 w-10 cursor-pointer items-center justify-center gap-1 rounded-md border p-1 transition-colors'
            >
              <div className='bg-foreground h-1 w-1 rounded-full' />
              <div className='bg-foreground h-1 w-1 rounded-full' />
              <div className='bg-foreground h-1 w-1 rounded-full' />
            </button>
            {menuOpen && (
              <div className='bg-background border-tertiary absolute top-12 right-0 z-30 w-50 rounded-md border shadow-md'>
                <button
                  onClick={() => handleConfirmationDialogOpen('edit')}
                  className='hover:bg-secondary px-lg flex w-full cursor-pointer items-center gap-2 rounded-md py-3 transition-colors'
                >
                  <Pencil className='text-foreground h-4.5 w-4.5' />
                  <p>Edit Dashboard</p>
                </button>
                <button
                  onClick={() => handleConfirmationDialogOpen('delete')}
                  className='hover:bg-secondary px-lg flex w-full cursor-pointer items-center gap-2 rounded-md py-3 text-red-400 transition-colors'
                >
                  <Trash className='h-4.5 w-4.5' />
                  <p>Delete Dashboard</p>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmationDialogOpen && (
        <div
          className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-black/40 backdrop-blur-sm'
          onClick={handleConfirmationDialogClose}
        >
          <div
            className='bg-background border-tertiary relative flex w-full max-w-md flex-col gap-2 rounded-md border p-4 shadow-md'
            onClick={(e) => e.stopPropagation()}
          >
            <Cross
              className='absolute top-3 right-3 h-3 w-3 cursor-pointer text-white'
              onClick={handleConfirmationDialogClose}
            />
            <h2 className='mb-2 text-center text-2xl font-bold'>
              {confirmationDialogType === 'delete'
                ? 'Delete Dashboard'
                : confirmationDialogType === 'edit'
                  ? 'Edit Dashboard'
                  : 'Create Dashboard'}
            </h2>
            {confirmationDialogType === 'delete' && (
              <p className='py-2 text-center text-lg font-medium'>Are you sure you want to delete this dashboard?</p>
            )}
            {(confirmationDialogType === 'edit' || confirmationDialogType === 'new') && (
              <>
                <Input
                  label='Name'
                  type='text'
                  placeholder='My Dashboard'
                  value={confirmationDialogName}
                  onChange={(e) => setConfirmationDialogName(e.target.value)}
                  className='w-full'
                />
                <div className='p-md border-tertiary flex items-center justify-between rounded-md border'>
                  <div className='flex flex-col'>
                    <p className='text-lg font-medium'>Set as default dashboard</p>
                    <p className='text-neutral text-sm'>Set this layout as the default layout for the dashboard.</p>
                  </div>
                  <button
                    type='button'
                    onClick={() => setConfirmationDialogIsDefaultLayout(!confirmationDialogIsDefaultLayout)}
                    className={cn(
                      'group relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
                      confirmationDialogIsDefaultLayout ? 'bg-primary' : 'bg-tertiary'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-200',
                        confirmationDialogIsDefaultLayout ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>
              </>
            )}
            {confirmationDialogError && <p className='text-sm text-red-400'>{confirmationDialogError}</p>}
            <PrimaryButton onClick={handleConfirmationDialogConfirm} className='w-full'>
              {confirmationDialogError ? 'Try Again' : 'Confirm'}
            </PrimaryButton>
          </div>
        </div>
      )}
    </>
  )
}

export default LayoutSelector
