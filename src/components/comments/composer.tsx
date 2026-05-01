'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/utils/tailwind'
import { usePostComment } from '@/hooks/comments/usePostComment'
import { useCommentQuota } from '@/hooks/comments/useCommentQuota'
import ArrowBack from 'public/icons/arrow-back.svg'

interface Props {
  name: string
}

const MAX_LEN = 500

const Composer: React.FC<Props> = ({ name }) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement>(null)
  const post = usePostComment(name)
  const quota = useCommentQuota()

  const used = quota.data?.used ?? 0
  const max = quota.data?.max ?? 0
  const remaining = quota.data?.remaining ?? Math.max(0, max - used)
  const quotaExhausted = quota.data ? remaining <= 0 : false

  const autoSize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || post.isPending) return
    if (trimmed.length > MAX_LEN) {
      setError(`Comment too long (max ${MAX_LEN} characters)`)
      return
    }
    setError(null)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'

    post.mutate(trimmed, {
      onError: (e) => {
        if (e.code === 'COMMENT_BANNED') {
          setError('You are banned from commenting')
        } else if (e.code === 'COMMENT_SUSPENDED') {
          setError(e.message)
        } else if (e.code === 'QUOTA_EXCEEDED') {
          setError('Daily limit reached. Try again later.')
        } else if (e.code === 'INVALID_BODY') {
          setError(e.message)
        } else {
          setError(e.message ?? 'Failed to post comment')
        }
        // Restore the user's text so they can adjust and retry
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
    <div className='border-tertiary flex flex-col gap-2 border-t-2 p-3'>
      {error && <p className='text-md text-red-400'>{error}</p>}
      <div className='bg-secondary border-tertiary flex items-end gap-2 rounded-md border p-2'>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            autoSize()
          }}
          onKeyDown={onKeyDown}
          disabled={quotaExhausted || post.isPending}
          rows={1}
          maxLength={MAX_LEN}
          placeholder={quotaExhausted ? 'Daily limit reached' : 'Add a comment…'}
          className={cn(
            'text-foreground placeholder:text-neutral max-h-32 flex-1 resize-none bg-transparent text-md leading-6 outline-none',
            (quotaExhausted || post.isPending) && 'cursor-not-allowed opacity-50'
          )}
        />
        <button
          onClick={submit}
          disabled={!value.trim() || post.isPending || quotaExhausted}
          className={cn(
            'bg-primary text-background flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all',
            'hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'
          )}
          aria-label='Post comment'
        >
          <Image src={ArrowBack} alt='' width={12} height={12} className='invert' />
        </button>
      </div>
      <div className='text-neutral flex items-center justify-between text-xs'>
        <span>
          {value.length}/{MAX_LEN}
        </span>
        {quota.data && (
          <span>
            {used}/{max} comments used today
          </span>
        )}
      </div>
    </div>
  )
}

export default Composer
