'use client'

import React from 'react'
import { Cross } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { removeComponent } from '@/state/reducers/dashboard'
import { WIDGET_LABELS, type DashboardComponentType } from '@/state/reducers/dashboard/types'

interface DashboardComponentWrapperProps {
  id: string
  type: DashboardComponentType
  children: React.ReactNode
}

const DashboardComponentWrapper: React.FC<DashboardComponentWrapperProps> = ({ id, type, children }) => {
  const dispatch = useAppDispatch()

  return (
    <div className='border-tertiary bg-background flex h-full flex-col overflow-hidden rounded-lg border'>
      {/* Title bar */}
      <div className='border-tertiary flex shrink-0 items-center justify-between border-b px-3 py-2'>
        <div className='flex items-center gap-2'>
          {/* Drag handle */}
          <div className='dashboard-drag-handle text-neutral flex cursor-grab items-center active:cursor-grabbing'>
            <svg width='14' height='14' viewBox='0 0 16 16' fill='currentColor'>
              <circle cx='4' cy='3' r='1.5' />
              <circle cx='12' cy='3' r='1.5' />
              <circle cx='4' cy='8' r='1.5' />
              <circle cx='12' cy='8' r='1.5' />
              <circle cx='4' cy='13' r='1.5' />
              <circle cx='12' cy='13' r='1.5' />
            </svg>
          </div>
          <span className='text-sm font-semibold'>{WIDGET_LABELS[type]}</span>
        </div>
        <button
          onClick={() => dispatch(removeComponent(id))}
          className='text-neutral cursor-pointer rounded p-1 transition-colors hover:bg-white/10 hover:text-white'
        >
          <Cross className='h-3 w-3' />
        </button>
      </div>

      {/* Content area — fills remaining space, scrollable */}
      <div className='relative flex-1 overflow-auto'>{children}</div>
    </div>
  )
}

export default DashboardComponentWrapper
