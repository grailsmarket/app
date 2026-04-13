'use client'

import React, { useCallback } from 'react'
import { Cross } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { addComponent, setSidebarOpen } from '@/state/reducers/dashboard'
import { selectDashboardSidebarOpen } from '@/state/reducers/dashboard/selectors'
import { WIDGET_LABELS, type DashboardComponentType } from '@/state/reducers/dashboard/types'
import { useNavbar } from '@/context/navbar'
import { cn } from '@/utils/tailwind'
import { useClickAway } from '@/hooks/useClickAway'

const WIDGET_CATEGORIES: { label: string; items: DashboardComponentType[] }[] = [
  {
    label: 'Market',
    items: ['domains', 'activity'],
  },
  {
    label: 'Analytics',
    items: ['top-sales', 'top-offers', 'top-registrations', 'sales-chart', 'offers-chart', 'registrations-chart'],
  },
  {
    label: 'Community',
    items: ['leaderboard', 'holders'],
  },
]

interface DraggableWidgetCardProps {
  type: DashboardComponentType
}

const DraggableWidgetCard: React.FC<DraggableWidgetCardProps> = ({ type }) => {
  const dispatch = useAppDispatch()

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('dashboard/widget-type', type)
      e.dataTransfer.effectAllowed = 'copy'
    },
    [type]
  )

  const handleClick = useCallback(() => {
    dispatch(addComponent({ type }))
  }, [dispatch, type])

  return (
    <div
      draggable
      unselectable='on'
      onDragStart={handleDragStart}
      onClick={handleClick}
      className='border-tertiary hover:border-primary/40 hover:bg-primary/5 flex cursor-grab items-center justify-between rounded-md border px-3 py-2 text-sm font-medium transition-colors active:cursor-grabbing'
    >
      <span>{WIDGET_LABELS[type]}</span>
      <span className='text-neutral text-xs'>+ click to add</span>
    </div>
  )
}

const DashboardSidebar = () => {
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const isOpen = useAppSelector(selectDashboardSidebarOpen)

  const closeSidebar = () => {
    dispatch(setSidebarOpen(false))
  }

  const clickAwayRef = useClickAway<HTMLDivElement>(() => {
    dispatch(setSidebarOpen(false))
  })

  const sidebarContent = (
    <div
      className={cn(
        'border-tertiary bg-background absolute top-0 left-0 z-40 h-full w-72 flex-col border-r transition-all starting:-translate-x-full',
        isOpen ? 'flex translate-x-0' : 'hidden -translate-x-full'
      )}
    >
      <div className='flex items-center justify-between px-4 py-3'>
        <h2 className='text-lg font-semibold'>Add Widgets</h2>
        <button
          onClick={() => dispatch(setSidebarOpen(false))}
          className='text-neutral cursor-pointer rounded p-1 transition-colors hover:text-white'
        >
          <Cross className='h-3.5 w-3.5' />
        </button>
      </div>

      <p className='text-neutral px-4 pb-3 text-xs'>Drag onto the grid or click to add.</p>

      <div className='flex-1 space-y-4 overflow-y-auto px-4 pb-4'>
        {WIDGET_CATEGORIES.map((category) => (
          <div key={category.label}>
            <p className='text-neutral mb-2 text-xs font-semibold tracking-wider uppercase'>{category.label}</p>
            <div className='flex flex-col gap-1.5'>
              {category.items.map((type) => (
                <DraggableWidgetCard key={type} type={type} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop (>=1024px): in-flow sticky sidebar that pushes content */}
      <div
        ref={clickAwayRef}
        className={cn(
          'fixed z-20 hidden h-dvh transition-all duration-300 lg:flex',
          isNavbarVisible ? 'top-[130px]' : 'top-14.5'
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile (<1024px): fixed overlay */}
      <div className={cn('fixed inset-0 z-30 transition-all lg:hidden', isNavbarVisible ? 'top-[116px]' : 'top-14.5')}>
        <div className='absolute inset-0 top-0 left-0 bg-black/40' onClick={closeSidebar} />
        <div className='relative z-40 h-full w-fit pt-14'>{sidebarContent}</div>
      </div>
    </>
  )
}

export default DashboardSidebar
