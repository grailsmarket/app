import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Cross, Pencil, Trash } from 'ethereum-identity-kit'
import { useDashboardSync } from '../hooks/useDashboardSync'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { renameDashboard, resetDashboard } from '@/state/reducers/dashboard'
import { selectDashboard } from '@/state/reducers/dashboard/selectors'
import LoadingCell from '@/components/ui/loadingCell'
import PrimaryButton from '@/components/ui/buttons/primary'
import Input from '@/components/ui/input'
import { cn } from '@/utils/tailwind'
import Star from 'public/icons/star.svg'
import type { DashboardLayoutResponse } from '@/api/dashboard/types'

type ConfirmationType = 'delete' | 'edit' | 'new'

const TRANSIENT_TAB_KEY = '__transient_new__'
const NEW_LAYOUT_BASE_NAME = 'New Layout'

const generateNewLayoutName = (existingLayouts: DashboardLayoutResponse[] | null | undefined): string => {
  const taken = new Set(existingLayouts?.map((l) => l.name) ?? [])
  if (!taken.has(NEW_LAYOUT_BASE_NAME)) return NEW_LAYOUT_BASE_NAME
  for (let n = 2; n < 1000; n++) {
    const candidate = `${NEW_LAYOUT_BASE_NAME} ${n}`
    if (!taken.has(candidate)) return candidate
  }
  return `${NEW_LAYOUT_BASE_NAME} ${Date.now()}`
}

const LayoutSelector = () => {
  const dispatch = useAppDispatch()
  const {
    layouts,
    isLoadingLayouts,
    loadLayout,
    removeLayout,
    saveLayout,
    createNewLayout,
    selectedLayoutId,
    setSelectedLayoutId,
  } = useDashboardSync()
  const dashboard = useAppSelector(selectDashboard)

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [confirmationDialogType, setConfirmationDialogType] = useState<ConfirmationType>('new')
  const [confirmationDialogName, setConfirmationDialogName] = useState('')
  const [confirmationDialogIsDefaultLayout, setConfirmationDialogIsDefaultLayout] = useState(false)
  const [confirmationDialogError, setConfirmationDialogError] = useState<string | null>(null)

  const [isCreatingLayout, setIsCreatingLayout] = useState(false)

  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const selectedLayout = useMemo(
    () => layouts?.find((layout) => layout.id === selectedLayoutId) ?? null,
    [layouts, selectedLayoutId]
  )

  // ── Confirmation dialog wiring (preserved verbatim from the previous UI) ──
  const handleConfirmationDialogOpen = useCallback(
    (type: ConfirmationType) => {
      setConfirmationDialogType(type)
      setConfirmationDialogOpen(true)

      if (type === 'edit') {
        setConfirmationDialogName(selectedLayout?.name ?? '')
        setConfirmationDialogIsDefaultLayout(selectedLayout?.isDefault ?? false)
      } else {
        setConfirmationDialogName('')
        setConfirmationDialogIsDefaultLayout(false)
      }
      setConfirmationDialogError(null)
    },
    [selectedLayout]
  )

  const handleConfirmationDialogClose = useCallback(() => {
    setConfirmationDialogOpen(false)
    setConfirmationDialogType('new')
    setConfirmationDialogName('')
    setConfirmationDialogError(null)
  }, [])

  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (confirmationDialogType === 'delete') {
      const response = await removeLayout()
      if (response.success) {
        handleConfirmationDialogClose()
      } else {
        setConfirmationDialogError(response.message as string)
      }
    } else {
      const response = await saveLayout(confirmationDialogName, confirmationDialogIsDefaultLayout)
      if (response.success) {
        handleConfirmationDialogClose()
      } else {
        setConfirmationDialogError(response.message as string)
      }
    }
  }, [
    confirmationDialogType,
    confirmationDialogName,
    confirmationDialogIsDefaultLayout,
    handleConfirmationDialogClose,
    removeLayout,
    saveLayout,
  ])

  // ── Tab interactions ──────────────────────────────────────────────────────

  const handleSelectTab = useCallback(
    (layout: DashboardLayoutResponse) => {
      if (layout.id === selectedLayoutId || isCreatingLayout) return
      loadLayout(layout)
    },
    [isCreatingLayout, loadLayout, selectedLayoutId]
  )

  const handleCreateNewLayout = useCallback(async () => {
    if (isCreatingLayout) return
    const previousSelectedLayout = selectedLayout
    const name = generateNewLayoutName(layouts)

    setIsCreatingLayout(true)
    setSelectedLayoutId(null)
    dispatch(resetDashboard())
    dispatch(renameDashboard(name))

    try {
      const response = await createNewLayout(name, { preserveLocalState: true })
      if (!response.success) {
        // Restore the previously selected layout so the user isn't stranded on an empty unselected dashboard.
        if (previousSelectedLayout) loadLayout(previousSelectedLayout)
      }
    } finally {
      setIsCreatingLayout(false)
    }
  }, [createNewLayout, dispatch, isCreatingLayout, layouts, loadLayout, selectedLayout, setSelectedLayoutId])

  useEffect(() => {
    const recompute = () => {
      const container = tabsContainerRef.current
      if (!container) return

      const activeKey = isCreatingLayout
        ? TRANSIENT_TAB_KEY
        : selectedLayoutId != null
          ? String(selectedLayoutId)
          : null

      if (!activeKey) {
        setIndicatorStyle({ left: 0, width: 0 })
        return
      }

      const activeTab = container.querySelector<HTMLElement>(`[data-layout-tab="${activeKey}"]`)
      if (activeTab) {
        setIndicatorStyle({ left: activeTab.offsetLeft, width: activeTab.offsetWidth })
      } else {
        setIndicatorStyle({ left: 0, width: 0 })
      }
    }

    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [layouts, selectedLayoutId, isCreatingLayout])

  const showActions = selectedLayout != null && !isCreatingLayout

  return (
    <>
      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <div className='flex min-w-0 flex-1 items-center'>
          {isLoadingLayouts ? (
            <div className='px-3 py-2'>
              <LoadingCell width='120px' height='24px' radius='4px' />
            </div>
          ) : (
            <div
              ref={tabsContainerRef}
              className='relative flex h-10 items-center overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            >
              {layouts?.map((layout) => (
                <LayoutTab
                  key={layout.id}
                  tabKey={String(layout.id)}
                  name={layout.name}
                  isDefault={layout.isDefault}
                  isSelected={selectedLayoutId === layout.id}
                  disabled={isCreatingLayout}
                  onClick={() => handleSelectTab(layout)}
                />
              ))}
              {isCreatingLayout && (
                <LayoutTab
                  tabKey={TRANSIENT_TAB_KEY}
                  name={dashboard.name}
                  isDefault={false}
                  isSelected
                  isPending
                  onClick={() => undefined}
                />
              )}
              <button
                type='button'
                onClick={handleCreateNewLayout}
                disabled={isCreatingLayout}
                aria-label='Create new layout'
                title='Create new layout'
                className={cn(
                  'hover:bg-secondary text-foreground/80 hover:text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-2xl leading-none font-light transition-colors',
                  isCreatingLayout ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                )}
              >
                +
              </button>
              <div
                className='bg-primary pointer-events-none absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out'
                style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
              />
            </div>
          )}
        </div>

        {showActions && (
          <div className='flex shrink-0 items-center gap-1'>
            <button
              type='button'
              onClick={() => handleConfirmationDialogOpen('edit')}
              aria-label='Rename dashboard'
              title='Rename dashboard'
              className='border-tertiary hover:border-foreground/50 hover:bg-secondary flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border transition-colors'
            >
              <Pencil className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={() => handleConfirmationDialogOpen('delete')}
              aria-label='Delete dashboard'
              title='Delete dashboard'
              className='border-tertiary hover:border-red-400/60 hover:bg-red-400/10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border text-red-400 transition-colors'
            >
              <Trash className='h-4 w-4' />
            </button>
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

interface LayoutTabProps {
  tabKey: string
  name: string
  isDefault: boolean
  isSelected: boolean
  isPending?: boolean
  disabled?: boolean
  onClick: () => void
}

const LayoutTab: React.FC<LayoutTabProps> = ({ tabKey, name, isDefault, isSelected, isPending, disabled, onClick }) => (
  <button
    type='button'
    data-layout-tab={tabKey}
    onClick={onClick}
    disabled={disabled || isPending}
    className={cn(
      'flex h-10 shrink-0 cursor-pointer items-center gap-1.5 px-3 text-lg whitespace-nowrap transition-opacity',
      isSelected ? 'text-primary font-bold opacity-100' : 'font-semibold opacity-50 hover:opacity-80',
      isPending && 'cursor-wait',
      disabled && !isSelected && 'cursor-not-allowed'
    )}
  >
    {isDefault && <Image src={Star} alt='Default layout' className='h-3.5 w-3.5 shrink-0' height={14} width={14} />}
    <span className='max-w-[160px] truncate'>{name}</span>
  </button>
)

export default LayoutSelector
