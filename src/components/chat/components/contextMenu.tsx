'use client'

import React, { useEffect, useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'

export interface ContextMenuItem {
  label: string
  icon?: string
  onClick: () => void
  destructive?: boolean
  confirmLabel?: string
}

interface Props {
  items: ContextMenuItem[]
  className?: string
  label?: string
  align?: 'left' | 'right'
  open: boolean
  onOpenChange: (open: boolean) => void
  position: 'top' | 'bottom'
  isGlobal?: boolean
}

const ContextMenu: React.FC<Props> = ({
  items,
  className,
  label = 'More options',
  align = 'right',
  open,
  onOpenChange,
  position,
  isGlobal,
}) => {
  const [confirming, setConfirming] = useState<number | null>(null)

  const changeOpen = (next: boolean) => {
    setConfirming(null)
    onOpenChange(next)
  }

  const ref = useClickAway<HTMLDivElement>(() => changeOpen(false))

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') changeOpen(false)
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
    changeOpen(false)
  }

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          changeOpen(!open)
        }}
        className={cn(
          className,
          'flex h-4 w-3 items-center justify-center rounded-md text-white/80 transition-colors hover:opacity-80'
        )}
        aria-label={label}
        aria-haspopup='menu'
        aria-expanded={open}
      >
        <svg width='4' height='12' viewBox='0 0 4 16' fill='none' xmlns='http://www.w3.org/2000/svg' aria-hidden>
          <circle cx='2' cy='2' r='1.5' fill='currentColor' />
          <circle cx='2' cy='8' r='1.5' fill='currentColor' />
          <circle cx='2' cy='14' r='1.5' fill='currentColor' />
        </svg>
      </button>

      {open && (
        <div
          role='menu'
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'absolute',
            position === 'top' ? 'top-full pt-1' : 'bottom-full pb-1',
            align === 'left' ? 'left-0' : 'right-0'
          )}
        >
          <div
            className={cn(
              'border-tertiary bg-background flex w-48 flex-col overflow-hidden rounded-md border-2 shadow-lg',
              isGlobal && 'w-36'
            )}
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
                    'px-md py-md text-md flex cursor-pointer items-center gap-2 text-left font-semibold transition-colors',
                    'hover:bg-secondary',
                    item.destructive && 'text-red-400 hover:bg-red-500/10',
                    isConfirming && 'bg-red-500/10 font-semibold'
                  )}
                >
                  {item.icon && (
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={16}
                      height={16}
                      className={cn('h-4 w-4', item.label === 'Copy text' && 'h-3 w-3 opacity-80')}
                    />
                  )}
                  <p>{isConfirming ? (item.confirmLabel ?? `Confirm: ${item.label}`) : item.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ContextMenu
