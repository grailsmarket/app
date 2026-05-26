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
import ArrowDown from 'public/icons/arrow-down.svg'
import Tooltip from '@/components/ui/tooltip'
import { useClickAway } from '@/hooks/useClickAway'
import type { DashboardLayoutResponse } from '@/api/dashboard/types'

type ConfirmationType = 'delete' | 'edit' | 'new'

const TRANSIENT_TAB_KEY = '__transient_new__'
const NEW_LAYOUT_BASE_NAME = 'New Layout'
const MOBILE_EDIT_HOLD_MS = 1000
const MOBILE_QUERY = '(max-width: 767px)'
const DRAG_START_DISTANCE = 3

type LayoutOrder = number[]

type PointerPress = {
  id: number
  pointerId: number
  startX: number
  startY: number
  dragging: boolean
  waitingForMobileEdit: boolean
}

const sortLayoutsByPosition = (layouts: DashboardLayoutResponse[]): DashboardLayoutResponse[] =>
  [...layouts].sort((a, b) => a.position - b.position || a.id - b.id)

const moveArrayItem = <T,>(items: T[], fromIndex: number, toIndex: number): T[] => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items

  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}

const createMergedLayoutOrder = (
  currentOrder: LayoutOrder,
  layouts: DashboardLayoutResponse[] | null | undefined
): LayoutOrder => {
  const sortedIds = sortLayoutsByPosition(layouts ?? []).map((layout) => layout.id)
  if (sortedIds.length === 0) return []

  const availableIds = new Set(sortedIds)
  const preservedIds = currentOrder.filter((id) => availableIds.has(id))
  const newIds = sortedIds.filter((id) => !preservedIds.includes(id))

  return [...preservedIds, ...newIds]
}

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

  const selectorRootRef = useRef<HTMLDivElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const holdTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  const pointerPressRef = useRef<PointerPress | null>(null)
  const suppressNextClickRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileEditing, setIsMobileEditing] = useState(false)
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false)
  const [draggingLayoutId, setDraggingLayoutId] = useState<number | null>(null)
  const [layoutOrder, setLayoutOrder] = useState<LayoutOrder>([])
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const mobileDropdownRef = useClickAway<HTMLDivElement>(() => setMobileDropdownOpen(false))

  const selectedLayout = useMemo(
    () => layouts?.find((layout) => layout.id === selectedLayoutId) ?? null,
    [layouts, selectedLayoutId]
  )

  const orderedLayouts = useMemo(() => {
    if (!layouts) return []

    const sortedLayouts = sortLayoutsByPosition(layouts)
    const layoutById = new Map(sortedLayouts.map((layout) => [layout.id, layout]))
    const ordered = layoutOrder.flatMap((id) => {
      const layout = layoutById.get(id)
      return layout ? [layout] : []
    })
    const orderedIds = new Set(ordered.map((layout) => layout.id))
    const missingLayouts = sortedLayouts.filter((layout) => !orderedIds.has(layout.id))

    return [...ordered, ...missingLayouts]
  }, [layoutOrder, layouts])

  const orderedLayoutIds = useMemo(() => orderedLayouts.map((layout) => layout.id), [orderedLayouts])
  const orderedLayoutKey = orderedLayoutIds.join(',')

  useEffect(() => {
    setLayoutOrder((currentOrder) => createMergedLayoutOrder(currentOrder, layouts))
  }, [layouts])

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const updateIsMobile = () => setIsMobile(mediaQuery.matches)

    updateIsMobile()
    mediaQuery.addEventListener('change', updateIsMobile)

    return () => mediaQuery.removeEventListener('change', updateIsMobile)
  }, [])

  useEffect(() => {
    if (isMobile) return

    setIsMobileEditing(false)
  }, [isMobile])

  useEffect(() => {
    if (!isMobile || !isMobileEditing) return

    const handlePointerDown = (event: PointerEvent) => {
      const selectorRoot = selectorRootRef.current
      if (selectorRoot?.contains(event.target as Node)) return

      setIsMobileEditing(false)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isMobile, isMobileEditing])

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

  const clearHoldTimer = useCallback(() => {
    if (!holdTimerRef.current) return

    window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
  }, [])

  const finishPointerInteraction = useCallback(() => {
    const wasDragging = pointerPressRef.current?.dragging

    clearHoldTimer()
    pointerPressRef.current = null
    setDraggingLayoutId(null)

    if (wasDragging) {
      window.setTimeout(() => {
        suppressNextClickRef.current = false
      }, 0)
    }
  }, [clearHoldTimer])

  useEffect(() => () => clearHoldTimer(), [clearHoldTimer])

  const beginDrag = useCallback(
    (layoutId: number) => {
      clearHoldTimer()
      pointerPressRef.current = pointerPressRef.current ? { ...pointerPressRef.current, dragging: true } : null
      suppressNextClickRef.current = true
      setDraggingLayoutId(layoutId)
    },
    [clearHoldTimer]
  )

  const reorderDraggedLayout = useCallback((layoutId: number, pointerX: number) => {
    const container = tabsContainerRef.current
    if (!container) return

    const tabElements = Array.from(container.querySelectorAll<HTMLElement>('[data-layout-id]')).filter(
      (tabElement) => tabElement.dataset.layoutId !== String(layoutId)
    )
    const targetIndex = tabElements.reduce((nextIndex, tabElement, index) => {
      const rect = tabElement.getBoundingClientRect()
      return pointerX > rect.left + rect.width / 2 ? index + 1 : nextIndex
    }, 0)

    setLayoutOrder((currentOrder) => {
      const fromIndex = currentOrder.indexOf(layoutId)
      if (fromIndex === -1) return currentOrder

      const boundedTargetIndex = Math.max(0, Math.min(targetIndex, currentOrder.length - 1))
      return moveArrayItem(currentOrder, fromIndex, boundedTargetIndex)
    })
  }, [])

  const handleTabPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, layoutId: number) => {
      if (isCreatingLayout || event.button !== 0) return

      event.currentTarget.setPointerCapture(event.pointerId)

      const waitingForMobileEdit = isMobile && !isMobileEditing
      pointerPressRef.current = {
        id: layoutId,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
        waitingForMobileEdit,
      }

      if (waitingForMobileEdit) {
        holdTimerRef.current = window.setTimeout(() => {
          setIsMobileEditing(true)
          beginDrag(layoutId)
        }, MOBILE_EDIT_HOLD_MS) as unknown as NodeJS.Timeout
        return
      }
    },
    [beginDrag, isCreatingLayout, isMobile, isMobileEditing]
  )

  const handleTabPointerMove = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const press = pointerPressRef.current
      if (!press || press.pointerId !== event.pointerId) return

      const deltaX = event.clientX - press.startX
      const deltaY = event.clientY - press.startY
      const movedDistance = Math.hypot(deltaX, deltaY)

      if (press.waitingForMobileEdit && !press.dragging) {
        if (movedDistance > 8) finishPointerInteraction()
        return
      }

      if (!press.dragging) {
        if (movedDistance < DRAG_START_DISTANCE) return
        beginDrag(press.id)
      }

      event.preventDefault()
      reorderDraggedLayout(press.id, event.clientX)
    },
    [beginDrag, finishPointerInteraction, reorderDraggedLayout]
  )

  const handleTabPointerUp = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerPressRef.current?.pointerId !== event.pointerId) return

      finishPointerInteraction()
    },
    [finishPointerInteraction]
  )

  const handleTabPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerPressRef.current?.pointerId !== event.pointerId) return

      finishPointerInteraction()
    },
    [finishPointerInteraction]
  )

  const handleSelectTab = useCallback(
    (layout: DashboardLayoutResponse) => {
      if (suppressNextClickRef.current) {
        suppressNextClickRef.current = false
        return
      }

      if (isMobileEditing) return
      if (layout.id === selectedLayoutId || isCreatingLayout) return
      loadLayout(layout)
    },
    [isCreatingLayout, isMobileEditing, loadLayout, selectedLayoutId]
  )

  const handleSelectLayoutFromDropdown = useCallback(
    (layout: DashboardLayoutResponse) => {
      setMobileDropdownOpen(false)

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
  }, [orderedLayoutKey, selectedLayoutId, isCreatingLayout])

  const showActions = selectedLayout != null && !isCreatingLayout

  return (
    <>
      <style>{`
        @keyframes dashboard-tab-jiggle {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
      `}</style>
      <div ref={selectorRootRef} className='flex min-w-0 flex-1 items-stretch justify-between'>
        <div className='flex min-w-0 flex-1 items-stretch px-2 md:items-center md:px-4'>
          {isLoadingLayouts ? (
            <div className='flex items-center px-3 py-2'>
              <LoadingCell width='120px' height='24px' radius='4px' />
            </div>
          ) : (
            <>
              <div ref={mobileDropdownRef} className='relative z-30 flex min-w-0 flex-1 items-stretch md:hidden'>
                <button
                  type='button'
                  onClick={() => setMobileDropdownOpen((open) => !open)}
                  disabled={isCreatingLayout}
                  aria-label='Select dashboard layout'
                  aria-expanded={mobileDropdownOpen}
                  className={cn(
                    'hover:bg-secondary flex min-h-12 min-w-0 flex-1 cursor-pointer items-center justify-between gap-2 px-2 transition-colors',
                    isCreatingLayout && 'cursor-wait opacity-70'
                  )}
                >
                  <span className='text-primary min-w-0 truncate text-lg font-bold'>
                    {isCreatingLayout ? dashboard.name : (selectedLayout?.name ?? 'Select Layout')}
                  </span>
                  <Image
                    src={ArrowDown}
                    alt='Dropdown arrow'
                    height={12}
                    width={12}
                    className={cn('shrink-0 transition-transform', mobileDropdownOpen && 'rotate-180')}
                  />
                </button>

                {mobileDropdownOpen && (
                  <div className='bg-background border-tertiary absolute top-full left-0 z-40 mt-2 w-full overflow-hidden rounded-md border shadow-md'>
                    {orderedLayouts.map((layout) => (
                      <button
                        type='button'
                        key={layout.id}
                        className={cn(
                          'hover:bg-secondary flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors',
                          selectedLayoutId === layout.id && 'text-primary font-bold'
                        )}
                        onClick={() => handleSelectLayoutFromDropdown(layout)}
                      >
                        <span className='min-w-0 wrap-anywhere'>{layout.name}</span>
                        {layout.isDefault && (
                          <Tooltip label='Default layout' position='top' align='right'>
                            <Image
                              src={Star}
                              alt='Default layout'
                              className='h-4 w-4 shrink-0'
                              height={16}
                              width={16}
                            />
                          </Tooltip>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type='button'
                onClick={handleCreateNewLayout}
                disabled={isCreatingLayout}
                aria-label='Create new layout'
                title='Create new layout'
                className={cn(
                  'hover:bg-secondary text-foreground/80 hover:text-foreground flex min-h-12 w-10 shrink-0 items-center justify-center text-2xl leading-none font-light transition-colors md:hidden',
                  isCreatingLayout ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                )}
              >
                +
              </button>

              <div
                ref={tabsContainerRef}
                className='relative hidden h-10 scrollbar-none items-center overflow-x-auto overflow-y-hidden [-ms-overflow-style:none] md:flex [&::-webkit-scrollbar]:hidden'
              >
                {orderedLayouts.map((layout) => (
                  <LayoutTab
                    key={layout.id}
                    tabKey={String(layout.id)}
                    layoutId={layout.id}
                    name={layout.name}
                    isDefault={layout.isDefault}
                    isSelected={selectedLayoutId === layout.id}
                    isDragging={draggingLayoutId === layout.id}
                    isMobileEditing={isMobileEditing}
                    disabled={isCreatingLayout}
                    onClick={() => handleSelectTab(layout)}
                    onPointerDown={(event) => handleTabPointerDown(event, layout.id)}
                    onPointerMove={handleTabPointerMove}
                    onPointerUp={handleTabPointerUp}
                    onPointerCancel={handleTabPointerCancel}
                  />
                ))}
                {isCreatingLayout && (
                  <LayoutTab
                    tabKey={TRANSIENT_TAB_KEY}
                    layoutId={null}
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
                  className='bg-primary pointer-events-none absolute bottom-0 z-10 h-0.5 rounded-full transition-all duration-300 ease-out'
                  style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
                />
              </div>
            </>
          )}
        </div>

        {showActions && (
          <div className='flex shrink-0 items-stretch'>
            <button
              type='button'
              onClick={() => handleConfirmationDialogOpen('edit')}
              aria-label='Rename dashboard'
              title='Rename dashboard'
              className='border-tertiary hover:bg-secondary flex min-h-12 w-12 cursor-pointer items-center justify-center border-l-2 transition-all md:min-h-14'
            >
              <Pencil className='h-4 w-4' />
            </button>
            <button
              type='button'
              onClick={() => handleConfirmationDialogOpen('delete')}
              aria-label='Delete dashboard'
              title='Delete dashboard'
              className='border-tertiary flex min-h-12 w-12 cursor-pointer items-center justify-center border-l-2 text-red-400 transition-all hover:bg-red-400/10 md:min-h-14'
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
  layoutId: number | null
  name: string
  isDefault: boolean
  isSelected: boolean
  isDragging?: boolean
  isMobileEditing?: boolean
  isPending?: boolean
  disabled?: boolean
  onClick: () => void
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerMove?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void
  onPointerCancel?: (event: React.PointerEvent<HTMLButtonElement>) => void
}

const LayoutTab: React.FC<LayoutTabProps> = ({
  tabKey,
  layoutId,
  name,
  isDefault,
  isSelected,
  isDragging,
  isMobileEditing,
  isPending,
  disabled,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}) => (
  <button
    type='button'
    data-layout-tab={tabKey}
    data-layout-id={layoutId ?? undefined}
    onClick={onClick}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerCancel}
    disabled={disabled || isPending}
    className={cn(
      'flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-3 text-lg whitespace-nowrap transition-[opacity,transform,background-color,box-shadow] duration-200 ease-out',
      isSelected ? 'text-primary font-bold opacity-100' : 'font-semibold opacity-50 hover:opacity-80',
      isMobileEditing && !isPending && 'animate-[dashboard-tab-jiggle_180ms_ease-in-out_infinite] touch-none',
      isDragging && 'bg-secondary z-10 scale-105 opacity-100 shadow-lg',
      isPending && 'cursor-wait',
      disabled && !isSelected && 'cursor-not-allowed'
    )}
  >
    {isDefault && <Image src={Star} alt='Default layout' className='h-3.5 w-3.5 shrink-0' height={14} width={14} />}
    <span className='max-w-[160px] truncate'>{name}</span>
  </button>
)

export default LayoutSelector
