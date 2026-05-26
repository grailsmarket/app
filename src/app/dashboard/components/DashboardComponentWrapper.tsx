'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Cross } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { removeComponent, renameComponent } from '@/state/reducers/dashboard'
import { selectDashboardComponent } from '@/state/reducers/dashboard/selectors'
import { WIDGET_LABELS, type DashboardComponentType } from '@/state/reducers/dashboard/types'

interface DashboardComponentWrapperProps {
  id: string
  type: DashboardComponentType
  children: React.ReactNode
}

const DashboardComponentWrapper: React.FC<DashboardComponentWrapperProps> = ({ id, type, children }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectDashboardComponent(state, id))
  const displayName = config?.name || WIDGET_LABELS[type]

  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(displayName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  const commitRename = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== displayName) {
      dispatch(renameComponent({ id, name: trimmed }))
    } else {
      setEditValue(displayName)
    }
    setIsEditing(false)
  }, [editValue, displayName, dispatch, id])

  const cancelRename = useCallback(() => {
    setEditValue(displayName)
    setIsEditing(false)
  }, [displayName])

  return (
    <div className='border-tertiary bg-background flex h-full flex-col overflow-hidden rounded-lg border'>
      {/* Top bar — entire bar is the drag handle */}
      <div className='dashboard-drag-handle border-tertiary flex shrink-0 cursor-grab items-center justify-between border-b px-3 py-2 active:cursor-grabbing'>
        <div className='flex items-center gap-2'>
          <svg width='14' height='14' viewBox='0 0 16 16' fill='currentColor' className='text-neutral shrink-0'>
            <circle cx='4' cy='3' r='1.5' />
            <circle cx='12' cy='3' r='1.5' />
            <circle cx='4' cy='8' r='1.5' />
            <circle cx='12' cy='8' r='1.5' />
            <circle cx='4' cy='13' r='1.5' />
            <circle cx='12' cy='13' r='1.5' />
          </svg>
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className='bg-secondary rounded px-1.5 py-0.5 text-lg font-semibold outline-none'
              style={{ width: `${Math.max(editValue.length + 1, 6)}ch` }}
            />
          ) : (
            <span
              className='cursor-text text-lg font-semibold'
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setEditValue(displayName)
                setIsEditing(true)
              }}
            >
              {displayName}
            </span>
          )}
        </div>
        <button
          onMouseDown={(e) => e.stopPropagation()}
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
