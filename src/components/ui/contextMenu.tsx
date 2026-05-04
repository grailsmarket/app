'use client'

import React, { useEffect, useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'

export interface ContextMenuItem {
  label: string
  onClick: () => void
  destructive?: boolean
  /** Optional second-stage confirmation. When set, a click flips the item into
   *  the confirm row before firing onClick on a second click. */
  confirmLabel?: string
}

interface Props {
  items: ContextMenuItem[]
  /** Optional class on the trigger button — width/height/positioning. */
  className?: string
  /** ARIA label on the trigger. */
  label?: string
}

/**
 * Compact "three dots" overflow menu. Closes on outside click and Escape.
 * Items can opt into a two-step confirm by providing `confirmLabel`, which
 * matches the destructive-row pattern used elsewhere without spawning a modal.
 */
const ContextMenu: React.FC<Props> = ({ items, className, label = 'More options' }) => {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState<number | null>(null)

  const ref = useClickAway<HTMLDivElement>(() => {
    setOpen(false)
    setConfirming(null)
  })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirming(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleItemClick = (idx: number, item: ContextMenuItem) => {
    if (item.confirmLabel && confirming !== idx) {
      setConfirming(idx)
      return
    }
    item.onClick()
    setOpen(false)
    setConfirming(null)
  }

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
          setConfirming(null)
        }}
        className={cn(
          'hover:bg-primary/10 flex h-8 w-8 items-center justify-center rounded-md transition-colors',
          className
        )}
        aria-label={label}
        aria-haspopup='menu'
        aria-expanded={open}
      >
        {/* Three vertical dots, white to match other top-bar icons. */}
        <svg width='4' height='16' viewBox='0 0 4 16' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden>
          <circle cx='2' cy='2' r='1.5' fill='white' />
          <circle cx='2' cy='8' r='1.5' fill='white' />
          <circle cx='2' cy='14' r='1.5' fill='white' />
        </svg>
      </button>

      {open && (
        <div
          role='menu'
          onClick={(e) => e.stopPropagation()}
          className='border-tertiary bg-background absolute top-full right-0 z-[110] mt-1 flex w-56 flex-col overflow-hidden rounded-md border-2 shadow-lg'
        >
          {items.map((item, idx) => {
            const isConfirming = confirming === idx
            return (
              <button
                key={idx}
                role='menuitem'
                onClick={(e) => {
                  e.stopPropagation()
                  handleItemClick(idx, item)
                }}
                className={cn(
                  'px-md py-md cursor-pointer text-left text-lg font-medium transition-colors',
                  'hover:bg-secondary',
                  item.destructive && 'text-red-400 hover:bg-red-500/10',
                  isConfirming && 'bg-red-500/10 font-semibold'
                )}
              >
                {isConfirming ? (item.confirmLabel ?? `Confirm: ${item.label}`) : item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ContextMenu
