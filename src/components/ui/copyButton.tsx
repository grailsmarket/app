'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import CopyIcon from 'public/icons/copy.svg'
import CheckIcon from 'public/icons/check.svg'

export default function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  useEffect(() => {
    if (status === 'idle') return
    const timer = setTimeout(() => setStatus('idle'), 1500)
    return () => clearTimeout(timer)
  }, [status])

  return (
    <button
      type='button'
      aria-label={status === 'copied' ? 'Copied to clipboard' : `Copy ${value}`}
      title={status === 'error' ? 'Could not copy. Please try again.' : status === 'copied' ? 'Copied' : 'Copy address'}
      className='flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100'
      onClick={async (event) => {
        event.stopPropagation()
        try {
          await navigator.clipboard.writeText(value)
          setStatus('copied')
        } catch {
          setStatus('error')
        }
      }}
    >
      <Image src={status === 'copied' ? CheckIcon : CopyIcon} alt='' width={16} height={16} />
      <span className='sr-only' role='status'>
        {status === 'copied' ? 'Copied to clipboard' : status === 'error' ? 'Could not copy. Please try again.' : ''}
      </span>
    </button>
  )
}
