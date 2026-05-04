'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import { useSendMessage } from '@/hooks/chat/useSendMessage'
import { useTypingEmitter } from '@/hooks/chat/useTypingEmitter'
import ArrowBack from 'public/icons/arrow-back.svg'

interface Props {
  chatId: string
  disabled?: boolean
}

const MAX_LEN = 4000

const Composer: React.FC<Props> = ({ chatId, disabled }) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  // When the server returns 403 BLOCKED on send, the caller is being blocked
  // by the recipient. Disable the composer until the user reloads — further
  // sends will keep failing with the same error.
  const [permanentlyDisabled, setPermanentlyDisabled] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)
  const send = useSendMessage(chatId)
  const typing = useTypingEmitter(chatId)

  const inputDisabled = disabled || permanentlyDisabled

  const autoSize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className='border-tertiary border-t-2 p-3'>
      {error && <p className='text-md mb-2 text-red-400'>{error}</p>}
      <div className='bg-secondary border-tertiary flex items-end gap-2 rounded-md border p-2'>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            typing.onChange(e.target.value)
            autoSize()
          }}
          onBlur={() => typing.flush()}
          onKeyDown={onKeyDown}
          disabled={inputDisabled}
          rows={1}
          maxLength={MAX_LEN}
          placeholder='Type a message…'
          className={cn(
            'text-foreground placeholder:text-neutral max-h-40 flex-1 resize-none bg-transparent text-lg leading-6 outline-none',
            inputDisabled && 'cursor-not-allowed opacity-50'
          )}
        />
        <button
          onClick={() => {
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
