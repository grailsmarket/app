'use client'

import React, { useEffect, useRef } from 'react'
import { cn } from '@/utils/tailwind'

const MAX_LEN = 4000

interface Props {
  value: string
  onChange: (v: string) => void
  onSave: () => void
  onCancel: () => void
}

/**
 * Lightweight inline editor for a chat message. Enter saves, Shift+Enter inserts
 * a newline, Escape cancels. Autosizes to content and focuses on mount with the
 * caret at the end. Intentionally simpler than the Composer (no mentions/typing).
 */
const MessageEditor: React.FC<Props> = ({ value, onChange, onSave, onCancel }) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  const autoSize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
    autoSize()
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }

  return (
    <div className='flex w-full flex-col gap-1'>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          autoSize()
        }}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={MAX_LEN}
        className={cn(
          'bg-secondary border-tertiary text-foreground max-h-40 min-h-7 w-full resize-none rounded-md',
          'border p-2 text-lg outline-none'
        )}
      />
      <div className='text-neutral flex items-center gap-2 text-sm'>
        <button type='button' onClick={onSave} className='text-primary font-semibold hover:opacity-80'>
          Save
        </button>
        <button type='button' onClick={onCancel} className='hover:text-foreground'>
          Cancel
        </button>
        <span>Esc to cancel · Enter to save</span>
      </div>
    </div>
  )
}

export default MessageEditor
