import React from 'react'
import { Check } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { AlertIcon, InfoIcon } from './icons'

type NoticeTone = 'info' | 'warning' | 'danger' | 'success'

interface NoticeProps {
  tone?: NoticeTone
  title?: React.ReactNode
  children?: React.ReactNode
  /** Raw error text, folded behind a disclosure so the readable line stays on top. */
  details?: string | null
  className?: string
}

const TONE_CLASS_NAMES: Record<NoticeTone, { box: string; accent: string }> = {
  info: { box: 'bg-primary-soft border-primary-line', accent: 'text-primary' },
  warning: { box: 'bg-yellow-400/10 border-line-subtle', accent: 'text-yellow-400' },
  danger: { box: 'bg-red-900/20 border-red-500/20', accent: 'text-red-400' },
  success: { box: 'bg-green-400/12 border-line-subtle', accent: 'text-green-400' },
}

const Notice: React.FC<NoticeProps> = ({ tone = 'info', title, children, details, className }) => {
  const toneClassNames = TONE_CLASS_NAMES[tone]
  const Icon = tone === 'info' ? InfoIcon : tone === 'success' ? Check : AlertIcon

  return (
    <div
      role={tone === 'danger' ? 'alert' : undefined}
      className={cn('flex gap-3 rounded-lg border p-3 text-lg', toneClassNames.box, className)}
    >
      <Icon className={cn('mt-px h-5 w-5 shrink-0', toneClassNames.accent)} />
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        {title && <p className={cn('font-semibold', toneClassNames.accent)}>{title}</p>}
        {children && <p className='wrap-break-word'>{children}</p>}
        {details && (
          <details className='group mt-1'>
            <summary className='text-neutral hover:text-foreground text-md flex w-fit cursor-pointer list-none items-center gap-1.5 transition-colors [&::-webkit-details-marker]:hidden'>
              Error details
              <span
                aria-hidden='true'
                className='h-1.5 w-1.5 -translate-y-0.5 rotate-45 border-r-[1.5px] border-b-[1.5px] border-current transition-transform group-open:translate-y-0.5 group-open:rotate-[225deg]'
              />
            </summary>
            <pre className='bg-background text-neutral text-md mt-2 max-h-32 overflow-auto rounded-md p-2 font-mono break-all whitespace-pre-wrap'>
              {details}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

export default Notice
