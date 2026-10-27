'use client'

import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Cross } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { MinimizeIcon } from './icons'

export const MODAL_EASE_OUT = [0.22, 1, 0.36, 1] as const
const SHEET_EASE = [0.32, 0.72, 0, 1] as const
const DESKTOP_QUERY = '(min-width: 48rem)'

// Footer buttons: full width, 48px tall, darker fill on hover instead of fading.
export const modalActionClassName = 'h-10 w-full rounded-md text-lg'
export const modalPrimaryActionClassName = cn(
  modalActionClassName,
  'hover:bg-primary-hover hover:opacity-100 disabled:hover:bg-primary'
)
export const modalDangerActionClassName = cn(
  modalActionClassName,
  'text-background bg-red-400 hover:bg-red-400/85 disabled:hover:bg-red-400'
)

const headerButtonClassName =
  'text-neutral hover:bg-secondary hover:text-foreground focus-visible:outline-primary -mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2'

interface ModalShellProps {
  title?: React.ReactNode
  onClose: () => void
  /** A wallet prompt or transaction is in flight: hides the close button and ignores the scrim and Escape. */
  locked?: boolean
  /** Whether a scrim click or Escape closes the modal. Defaults to the opposite of `locked`. */
  dismissible?: boolean
  /** Shown above the stage and kept in place across steps, usually an AssetSummary. */
  subject?: React.ReactNode
  /** Changes on every step; the stage cross-fades and the panel height glides to fit. */
  stageKey?: string
  footer?: React.ReactNode
  footerHint?: React.ReactNode
  /** Draws a minimize button in place of the close button; the flow keeps running behind a toast. */
  onMinimize?: () => void
  /** Covers the whole panel, e.g. a date picker. */
  overlay?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

const ModalShell: React.FC<ModalShellProps> = ({
  title,
  onClose,
  locked = false,
  dismissible,
  subject,
  stageKey = 'stage',
  footer,
  footerHint,
  onMinimize,
  overlay,
  className,
  children,
}) => {
  const titleId = useId()
  const reduceMotion = useReducedMotion()
  const [isDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches)
  const canDismiss = dismissible ?? !locked

  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')

  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => setContentHeight(entry.contentRect.height))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!canDismiss) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canDismiss, onClose])

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : isDesktop
      ? {
          initial: { opacity: 0, y: 12, scale: 0.97 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 8, scale: 0.98 },
          transition: { duration: 0.28, ease: MODAL_EASE_OUT },
        }
      : {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
          transition: { duration: 0.36, ease: SHEET_EASE },
        }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24 }}
      onClick={() => {
        if (canDismiss) onClose()
      }}
      className='bg-scrim fixed inset-0 z-1000 flex h-dvh w-screen items-end justify-center backdrop-blur-[6px] md:items-center md:p-4'
    >
      <motion.div
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? titleId : undefined}
        aria-busy={locked || undefined}
        onClick={(e) => e.stopPropagation()}
        {...panelMotion}
        className={cn(
          'border-tertiary bg-background shadow-modal relative flex max-h-[calc(100dvh-80px)] w-full flex-col overflow-hidden rounded-t-xl border border-b-0 md:max-w-md md:rounded-xl md:border-b',
          className
        )}
      >
        <div aria-hidden='true' className='bg-tertiary mx-auto mt-2 h-1 w-9 shrink-0 rounded-full md:hidden' />
        <div className='flex shrink-0 items-center gap-3 px-4 pt-4 pb-2 md:px-6'>
          <h2 id={titleId} className='font-sedan-sc min-w-0 flex-1 truncate text-3xl'>
            {title}
          </h2>
          {onMinimize ? (
            <button type='button' aria-label='Minimize' onClick={onMinimize} className={headerButtonClassName}>
              <MinimizeIcon className='h-5 w-5' />
            </button>
          ) : (
            <button
              type='button'
              aria-label='Close'
              onClick={onClose}
              disabled={locked}
              className={cn(headerButtonClassName, locked && 'pointer-events-none opacity-0')}
            >
              <Cross className='h-3.5 w-3.5' />
            </button>
          )}
        </div>

        <div className='flex min-h-0 flex-1 scrollbar-none flex-col gap-3 overflow-y-auto px-4 pt-1 pb-4'>
          {subject}
          <motion.div
            initial={false}
            animate={{ height: contentHeight }}
            transition={{ duration: reduceMotion ? 0 : 0.32, ease: MODAL_EASE_OUT }}
          >
            <div ref={contentRef}>
              <AnimatePresence mode='wait' initial={false}>
                <motion.div
                  key={stageKey}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                  transition={{ duration: 0.2, ease: MODAL_EASE_OUT }}
                  className='flex flex-col gap-3'
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {(footer || footerHint) && (
          <div className='border-line-subtle flex shrink-0 flex-col gap-2 border-t px-4 pt-3 pb-4 md:pt-4'>
            {footer}
            {footerHint && <p className='text-neutral text-md text-center'>{footerHint}</p>}
          </div>
        )}

        <AnimatePresence>
          {overlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className='xs:p-4 absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'
            >
              {overlay}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default ModalShell
