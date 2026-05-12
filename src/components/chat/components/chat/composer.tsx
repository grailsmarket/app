'use client'

import React, { useCallback, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import { useSendMessage } from '@/hooks/chat/useSendMessage'
import { useTypingEmitter } from '@/hooks/chat/useTypingEmitter'
import ArrowBack from 'public/icons/arrow-back.svg'
import MentionDropdown from './mentionDropdown'

interface Props {
  chatId: string
  disabled?: boolean
}

const MAX_LEN = 4000
const MENTION_MIN_QUERY = 2

interface MentionState {
  start: number
  query: string
}

// Counts unicode code points so multi-code-unit characters (emoji) count as 1.
const codePointLength = (s: string) => Array.from(s).length

// Walk back from the caret to find an active `@<query>` mention.
// Returns null if the caret isn't inside a mention.
const detectMention = (value: string, caret: number): MentionState | null => {
  for (let i = caret - 1; i >= 0; i--) {
    const ch = value[i]
    if (ch === '@') {
      const prev = i === 0 ? '' : value[i - 1]
      if (i !== 0 && !/\s/.test(prev)) return null
      return { start: i, query: value.slice(i + 1, caret) }
    }
    if (/\s/.test(ch)) return null
  }
  return null
}

const Composer: React.FC<Props> = ({ chatId, disabled }) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  // When the server returns 403 BLOCKED on send, the caller is being blocked
  // by the recipient. Disable the composer until the user reloads — further
  // sends will keep failing with the same error.
  const [permanentlyDisabled, setPermanentlyDisabled] = useState(false)
  const [mention, setMention] = useState<MentionState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [resultCount, setResultCount] = useState(0)
  const ref = useRef<HTMLTextAreaElement>(null)
  const send = useSendMessage(chatId)
  const typing = useTypingEmitter(chatId)

  const inputDisabled = disabled || permanentlyDisabled
  const mentionActive = mention !== null && codePointLength(mention.query) >= MENTION_MIN_QUERY
  const dropdownOpen = mentionActive && resultCount > 0

  const autoSize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const closeMention = useCallback(() => {
    setMention(null)
    setSelectedIndex(0)
    setResultCount(0)
  }, [])

  const updateMentionFromCaret = useCallback((nextValue: string, caret: number) => {
    const next = detectMention(nextValue, caret)
    setMention((prev) => {
      if (!next) return null
      // Reset the highlighted row when the query changes.
      if (!prev || prev.query !== next.query) setSelectedIndex(0)
      return next
    })
  }, [])

  const insertMention = (name: string) => {
    const el = ref.current
    if (!el || !mention) return
    // The caret may sit inside a partial mention; consume the rest of the
    // unbroken token so we don't leave dangling characters after the insert.
    let end = el.selectionStart ?? value.length
    while (end < value.length && !/\s/.test(value[end])) end++
    const before = value.slice(0, mention.start)
    const after = value.slice(end)
    const insertion = `@${name} `
    const nextValue = before + insertion + after
    setValue(nextValue)
    typing.onChange(nextValue)
    closeMention()
    const nextCaret = before.length + insertion.length
    requestAnimationFrame(() => {
      const node = ref.current
      if (!node) return
      node.focus()
      node.setSelectionRange(nextCaret, nextCaret)
      autoSize()
    })
  }

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || send.isPending) return
    if (trimmed.length > MAX_LEN) {
      setError(`Message too long (max ${MAX_LEN} characters)`)
      return
    }
    setError(null)
    setValue('')
    closeMention()
    typing.flush()
    if (ref.current) {
      ref.current.style.height = 'auto'
    }
    send.mutate(trimmed, {
      onError: (e) => {
        if (e.code === 'BLOCKED') {
          setError("Couldn't deliver, you have been blocked")
          setPermanentlyDisabled(true)
          // Drop the unsent text — retry isn't useful when blocked.
          return
        }
        setError(e.message ?? 'Failed to send')
        // Restore the unsent text so the user can retry
        setValue(trimmed)
        requestAnimationFrame(autoSize)
      },
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (dropdownOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % resultCount)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + resultCount) % resultCount)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        keyboardSelectRef.current?.()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMention()
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  // MentionDropdown owns the fetched result list. It registers a callback
  // here so the composer's keydown handler can commit the highlighted choice.
  const keyboardSelectRef = useRef<(() => void) | null>(null)
  const registerKeyboardSelect = useCallback((fn: (() => void) | null) => {
    keyboardSelectRef.current = fn
  }, [])

  return (
    <div className='border-tertiary relative border-t-2 p-3'>
      {error && <p className='text-md mb-2 text-red-400'>{error}</p>}
      <div className='bg-secondary border-tertiary relative flex items-end gap-2 rounded-md border p-2'>
        {mention && codePointLength(mention.query) >= MENTION_MIN_QUERY && (
          <MentionDropdown
            query={mention.query}
            selectedIndex={selectedIndex}
            onHoverIndex={setSelectedIndex}
            onSelect={insertMention}
            onResultsChange={setResultCount}
            registerKeyboardSelect={registerKeyboardSelect}
          />
        )}
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            const nextValue = e.target.value
            setValue(nextValue)
            typing.onChange(nextValue)
            autoSize()
            updateMentionFromCaret(nextValue, e.target.selectionStart ?? nextValue.length)
          }}
          onSelect={(e) => {
            const target = e.currentTarget
            updateMentionFromCaret(target.value, target.selectionStart ?? target.value.length)
          }}
          onBlur={() => {
            typing.flush()
            // Defer so a click on a dropdown row can fire before we close it.
            setTimeout(closeMention, 0)
          }}
          onKeyDown={onKeyDown}
          disabled={inputDisabled}
          rows={1}
          maxLength={MAX_LEN}
          placeholder='Type a message…'
          className={cn(
            'text-foreground placeholder:text-neutral max-h-40 flex-1 resize-none bg-transparent text-lg leading-7 outline-none',
            inputDisabled && 'cursor-not-allowed opacity-50'
          )}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            ref.current?.focus()
            submit()
          }}
          disabled={!value.trim() || send.isPending || inputDisabled}
          className={cn(
            'bg-primary text-background flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all',
            'hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label='Send message'
        >
          <Image src={ArrowBack} alt='' width={12} height={12} className='invert' />
        </button>
      </div>
    </div>
  )
}

export default Composer
