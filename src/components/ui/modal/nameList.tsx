'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import { AlertIcon, ChevronIcon } from './icons'

export interface NameListItem {
  key: string
  name: string
  status: 'available' | 'checking' | 'unavailable'
  price?: React.ReactNode
  duration?: React.ReactNode
  isCustom?: boolean
  warning?: React.ReactNode
  editor?: React.ReactNode
}

interface NameListProps {
  items: NameListItem[]
  openKey: string | null
  onToggle: (key: string | null) => void
}

const NameList: React.FC<NameListProps> = ({ items, openKey, onToggle }) => {
  return (
    <section className='flex flex-col gap-2'>
      <ul className='bg-secondary scrollbar-custom border-tertiary flex max-h-66 flex-col overflow-y-auto rounded-lg border'>
        {items.map((item, i) => {
          const isOpen = openKey === item.key
          const isUnavailable = item.status === 'unavailable'
          const isEditable = !isUnavailable && !!item.editor
          const isLast = i + 1 === items.length

          return (
            <li
              key={item.key}
              className={cn(
                'border-tertiary flex flex-col transition-colors',
                isOpen ? 'bg-background' : 'hover:bg-white/3',
                !isLast && 'border-b'
              )}
            >
              <div className='flex min-w-0 items-center gap-2.5 pl-3'>
                <span
                  aria-hidden='true'
                  className={cn(
                    'gradient-blue h-6 w-6 shrink-0 rounded-sm',
                    isUnavailable && 'opacity-40 grayscale',
                    item.status === 'checking' && 'opacity-60'
                  )}
                />
                <span className='flex min-w-0 flex-1 items-center gap-2'>
                  <span
                    className={cn(
                      'min-w-0 truncate text-lg font-semibold',
                      isUnavailable && 'text-neutral decoration-tertiary line-through'
                    )}
                  >
                    {item.name}
                  </span>
                  {isUnavailable && (
                    <span className='shrink-0 rounded-sm bg-red-900/20 px-1.5 py-0.5 text-sm font-bold text-red-400'>
                      Unavailable
                    </span>
                  )}
                  {item.status === 'checking' && (
                    <span className='bg-tertiary text-neutral shrink-0 rounded-sm px-1.5 py-0.5 text-sm font-bold'>
                      Checking...
                    </span>
                  )}
                </span>
                {!isUnavailable && item.price && (
                  <span className='text-neutral text-md shrink-0 tabular-nums'>{item.price}</span>
                )}
                {!isUnavailable && item.duration && (
                  <button
                    type='button'
                    disabled={!isEditable}
                    aria-label={`Edit duration for ${item.name}`}
                    onClick={() => onToggle(isOpen ? null : item.key)}
                    className={cn(
                      'text-md flex h-12 min-w-23 shrink-0 cursor-pointer items-center justify-center gap-1 border-l pr-3 pl-2.5 font-semibold whitespace-nowrap transition-colors disabled:cursor-default',
                      item.warning
                        ? 'border-yellow-400 bg-yellow-400/10 text-yellow-400'
                        : item.isCustom
                          ? 'border-primary-line bg-primary-soft text-primary'
                          : 'border-tertiary hover:bg-tertiary'
                    )}
                  >
                    <p>{item.duration}</p>
                    <ChevronIcon
                      className={cn(
                        'text-neutral h-3.5 w-3.5! transition-transform duration-300',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                )}
              </div>
              {item.warning && !isOpen && (
                <p className='text-md flex items-center gap-1.5 pl-8.5 text-yellow-400'>
                  <AlertIcon className='h-3.5 w-3.5 shrink-0' />
                  {item.warning}
                </p>
              )}
              {isOpen && isEditable && <div className='messageIn p-3 pt-2'>{item.editor}</div>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default NameList
