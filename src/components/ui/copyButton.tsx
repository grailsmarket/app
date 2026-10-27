'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import CopyIcon from 'public/icons/copy.svg'
import CheckIcon from 'public/icons/check.svg'

interface CopyButtonProps {
  value: string
  size?: number
}

const CopyButton: React.FC<CopyButtonProps> = ({ value, size = 16 }) => {
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
      className='flex h-fit w-fit shrink-0 cursor-pointer items-center justify-center opacity-70 transition-opacity hover:opacity-100'
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
      <Image src={status === 'copied' ? CheckIcon : CopyIcon} alt='' width={size} height={size} />
    </button>
  )
}

export default CopyButton
