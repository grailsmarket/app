'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Cross } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { useSendMessage } from '@/hooks/chat/useSendMessage'
import { useGlobalChatInfo } from '@/hooks/chat/useGlobalChatInfo'
import { useTypingEmitter } from '@/hooks/chat/useTypingEmitter'
import ArrowBack from 'public/icons/arrow-back.svg'
import ImageIcon from 'public/icons/image.svg'
import MentionDropdown from './mentionDropdown'
import ReplyPreview from '../replyPreview'
import {
  ChatMessage,
  MappedSendError,
  MentionState,
  ReplyPreview as ReplyPreviewData,
  SendController,
  SendMessageError,
} from '@/types/chat'
import { mapSendError } from '@/utils/chat/errors'
import { codePointLength, detectMention } from '@/utils/chat/message'
import {
  CHAT_IMAGE_ALLOWED_TYPES,
  CHAT_IMAGE_MAX_BYTES,
  MESSAGE_INPUT_MAX_HEIGHT,
  MESSAGE_MAX_LEN,
} from '@/constants/chat'

const MENTION_MIN_QUERY = 2
/** Max characters of the parent body kept in a reply's optimistic preview. */
const REPLY_PREVIEW_MAX_LEN = 140

interface Props {
  chatId: string
  disabled?: boolean
  send?: SendController
  /** Suppress typing-indicator emission (global chat has no typing). */
  disableTyping?: boolean
  /** Rendered below the input row (e.g. the global chat quota line). */
  footerSlot?: React.ReactNode
  mapSendError?: (e: SendMessageError) => MappedSendError | null
  /** Message being replied to (renders a banner; threaded into send). */
  replyingTo?: ChatMessage | null
  onCancelReply?: () => void
  /** Re-assert the reply target after a failed send (mirrors text restoration). */
  onRestoreReply?: (message: ChatMessage) => void
}

const Composer: React.FC<Props> = ({
  chatId,
  disabled,
  send: sendOverride,
  disableTyping,
  footerSlot,
  replyingTo,
  onCancelReply,
  onRestoreReply,
}) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [permanentlyDisabled, setPermanentlyDisabled] = useState(false)
  const [mention, setMention] = useState<MentionState | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [resultCount, setResultCount] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const ref = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaultSend = useSendMessage(chatId)
  const send: SendController = sendOverride ?? defaultSend
  const typing = useTypingEmitter(disableTyping ? null : chatId)

  const { data: chatInfo } = useGlobalChatInfo()
  const imagesEnabled = !!chatInfo?.images_enabled
  const maxImageBytes = chatInfo?.max_image_bytes ?? CHAT_IMAGE_MAX_BYTES
  const uploading = send.isPending && !!file

  const inputDisabled = disabled || permanentlyDisabled || uploading

  // Manage the object URL backing the selected image's composer preview.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const mentionActive = mention !== null && codePointLength(mention.query) >= MENTION_MIN_QUERY
  const dropdownOpen = mentionActive && resultCount > 0

  // Single source for the reply-preview shape — consumed by both the banner and
  // the optimistic send payload so the two never drift.
  const replyPreview = useMemo<ReplyPreviewData | undefined>(() => {
    if (!replyingTo) return undefined
    return {
      id: replyingTo.id,
      sender_address: replyingTo.sender_address,
      body: replyingTo.body ? replyingTo.body.slice(0, REPLY_PREVIEW_MAX_LEN) : null,
      deleted: !!replyingTo.deleted_at,
    }
  }, [replyingTo])

  const autoSize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, MESSAGE_INPUT_MAX_HEIGHT) + 'px'
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

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = '' // let the same file be re-picked after removal
    if (!picked) return
    if (!CHAT_IMAGE_ALLOWED_TYPES.includes(picked.type)) {
      setError('Unsupported image type (use JPEG, PNG, GIF, or WebP)')
      return
    }
    if (picked.size > maxImageBytes) {
      setError(`Image is too large (max ${Math.round(maxImageBytes / (1024 * 1024))} MB)`)
      return
    }
    setError(null)
    setFile(picked)
  }

  const submit = () => {
    const trimmed = value.trim()
    if (send.isPending || (!trimmed && !file)) return
    if (trimmed.length > MESSAGE_MAX_LEN) {
      setError(`Message too long (max ${MESSAGE_MAX_LEN} characters)`)
      return
    }
    setError(null)

    const replyTo = replyPreview
    const replyToId = replyingTo?.id

    if (file) {
      // Image: keep the preview + caption visible during upload, then clear on
      // success. On error everything stays put so the user can retry.
      closeMention()
      send.mutate(
        { body: trimmed, file, replyToId, replyTo },
        {
          onError: (e) => setError(mapSendError(e).message),
          onSuccess: () => {
            setValue('')
            setFile(null)
            typing.flush()
            if (ref.current) ref.current.style.height = 'auto'
            onCancelReply?.()
          },
        }
      )
      return
    }

    // Text: optimistic — clear immediately and restore on failure.
    setValue('')
    closeMention()
    typing.flush()
    if (ref.current) {
      ref.current.style.height = 'auto'
    }
    // Capture the reply target before clearing it so a failed send can restore
    // it alongside the text (the banner is cleared optimistically below).
    const replySnapshot = replyingTo
    onCancelReply?.()
    send.mutate(
      { body: trimmed, replyToId, replyTo },
      {
        onError: (e) => {
          const mapped = mapSendError(e)
          setError(mapped.message)

          if (mapped.permanent) {
            setPermanentlyDisabled(true)
            return
          }

          if (mapped.restoreText !== false) {
            setValue(trimmed)
            if (replySnapshot) onRestoreReply?.(replySnapshot)
            requestAnimationFrame(autoSize)
          }
        },
      }
    )
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
      {replyPreview && (
        <div className='bg-secondary mb-2 flex items-start justify-between gap-2 rounded-md p-2'>
          <ReplyPreview replyTo={replyPreview} className='mb-0 min-w-0 flex-1' />
          <button
            type='button'
            onClick={onCancelReply}
            className='hover:bg-primary/10 text-neutral hover:text-foreground rounded p-1 transition-colors'
            aria-label='Cancel reply'
          >
            <Cross className='h-3.5 w-3.5' />
          </button>
        </div>
      )}
      {previewUrl && (
        <div className='bg-secondary mb-2 flex items-center gap-3 rounded-md p-2'>
          <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-md'>
            <img src={previewUrl} alt='' className='h-full w-full object-cover' />
            {uploading && (
              <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                <span className='h-5 w-5 animate-spin rounded-full border-2 border-white/90 border-t-transparent' />
              </div>
            )}
          </div>
          <span className='text-neutral text-md min-w-0 flex-1 truncate'>{file?.name}</span>
          <button
            type='button'
            onClick={() => setFile(null)}
            disabled={uploading}
            className='hover:bg-primary/10 text-neutral hover:text-foreground rounded p-1 transition-colors disabled:opacity-40'
            aria-label='Remove image'
          >
            <Cross className='h-3.5 w-3.5' />
          </button>
        </div>
      )}
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
        {imagesEnabled && (
          <>
            <input
              ref={fileInputRef}
              type='file'
              accept={CHAT_IMAGE_ALLOWED_TYPES.join(',')}
              onChange={onSelectFile}
              className='hidden'
            />
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={inputDisabled}
              className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40'
              aria-label='Attach image'
            >
              <Image src={ImageIcon} alt='' width={18} height={18} />
            </button>
          </>
        )}
        <textarea
          ref={ref}
          id='chat-composer-textarea'
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
          maxLength={MESSAGE_MAX_LEN}
          placeholder={file ? 'Add a caption…' : 'Type a message…'}
          className={cn(
            'text-foreground placeholder:text-neutral max-h-40 min-h-7 flex-1 resize-none bg-transparent pt-0.5 text-lg outline-none',
            inputDisabled && 'cursor-not-allowed opacity-50'
          )}
        />
        <button
          onClick={(e) => {
            e.preventDefault()
            ref.current?.focus()
            submit()
          }}
          disabled={(!value.trim() && !file) || send.isPending || inputDisabled}
          className={cn(
            'bg-primary text-background flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all',
            'hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label='Send message'
        >
          <Image src={ArrowBack} alt='' width={12} height={12} className='invert' />
        </button>
      </div>
      {footerSlot}
    </div>
  )
}

export default Composer
