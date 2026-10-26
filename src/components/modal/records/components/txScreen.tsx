'use client'

import React, { useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Cross } from 'ethereum-identity-kit'
import ModalShell, { MODAL_EASE_OUT } from '@/components/ui/modal/modalShell'
import TxLink from '@/components/ui/modal/txLink'
import { SyncIcon } from '@/components/ui/modal/icons'
import { activeChain } from '@/constants/web3/chain'
import { cn } from '@/utils/tailwind'
import PencilIcon from 'public/icons/pencil-primary.svg'

export const KEEP_OPEN_HINT = 'Keep this window open until the transaction confirms.'
export interface TxScreen {
  key: string
  subject?: React.ReactNode
  body: React.ReactNode
  footer?: React.ReactNode
  footerHint?: React.ReactNode
  locked: boolean
}

const headerButtonClassName =
  'text-neutral hover:bg-secondary hover:text-foreground focus-visible:outline-primary -mr-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2'

interface TxScreenPanelProps {
  screen: TxScreen
  title?: React.ReactNode
  onClose?: () => void
  center?: boolean
}

export const TxScreenPanel: React.FC<TxScreenPanelProps> = ({ screen, title, onClose, center }) => {
  const reduceMotion = useReducedMotion()
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto')

  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element || center) return

    const observer = new ResizeObserver(([entry]) => setContentHeight(entry.contentRect.height))
    observer.observe(element)
    return () => observer.disconnect()
  }, [center])

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      {title && (
        <div className='flex shrink-0 items-center gap-3 px-4 pt-4 pb-2 md:px-6'>
          <h2 className='font-sedan-sc min-w-0 flex-1 truncate text-3xl'>{title}</h2>
          {onClose && (
            <button
              type='button'
              aria-label='Close'
              onClick={onClose}
              disabled={screen.locked}
              className={cn(headerButtonClassName, screen.locked && 'pointer-events-none opacity-0')}
            >
              <Cross className='h-3.5 w-3.5' />
            </button>
          )}
        </div>
      )}

      <div
        aria-busy={screen.locked || undefined}
        className={cn(
          'flex min-h-0 flex-1 scrollbar-none flex-col gap-3 overflow-y-auto overscroll-contain px-4 pb-4',
          title ? 'pt-1' : 'pt-4'
        )}
      >
        {screen.subject}
        <motion.div
          initial={false}
          animate={{ height: center ? 'auto' : contentHeight }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: MODAL_EASE_OUT }}
          className={cn(center && 'my-auto')}
        >
          <div ref={contentRef}>
            <AnimatePresence mode='wait' initial={false}>
              <motion.div
                key={screen.key}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                transition={{ duration: 0.2, ease: MODAL_EASE_OUT }}
                className='flex flex-col gap-3'
              >
                {screen.body}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {(screen.footer || screen.footerHint) && (
        <div className='border-line-subtle flex shrink-0 flex-col gap-2 border-t px-4 pt-3 pb-4 md:pt-4'>
          {screen.footer}
          {screen.footerHint && <p className='text-neutral text-md text-center'>{screen.footerHint}</p>}
        </div>
      )}
    </div>
  )
}

/** A screen in a ModalShell: the image upload modal and the preview route. */
export const TxScreenShell: React.FC<{
  screen: TxScreen
  title?: React.ReactNode
  onClose: () => void
  dismissible?: boolean
}> = ({ screen, title, onClose, dismissible }) => (
  <ModalShell
    title={title}
    onClose={onClose}
    locked={screen.locked}
    dismissible={dismissible}
    stageKey={screen.key}
    subject={screen.subject}
    footer={screen.footer}
    footerHint={screen.footerHint}
  >
    {screen.body}
  </ModalShell>
)

/** "View on Etherscan" for one transaction, "Transaction 1…n" for several. */
export const txLinkLabel = (index: number, total: number) =>
  total === 1 ? `View on ${activeChain.blockExplorers.default.name}` : `Transaction ${index + 1}`

/** A labelled TxLink per transaction, centred under a success status. */
export const TxLinkList: React.FC<{ links: { key: string; hash: string; label?: string }[]; className?: string }> = ({
  links,
  className,
}) => {
  if (links.length === 0) return null

  return (
    <div className={cn('flex flex-wrap justify-center gap-1.5', className)}>
      {links.map((link, index) => (
        <TxLink key={link.key} hash={link.hash} label={link.label ?? txLinkLabel(index, links.length)} />
      ))}
    </div>
  )
}

/** A quiet follow-up action under a status: "Back to Editor", "Reload Records", a row's "Retry". */
export const GhostButton: React.FC<{
  icon?: 'pencil' | 'sync'
  onClick: () => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}> = ({ icon, onClick, disabled, className, children }) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'text-primary hover:bg-secondary focus-visible:outline-primary mx-auto flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
  >
    {icon === 'sync' && <SyncIcon className='h-4.5 w-4.5' />}
    {children}
    {icon === 'pencil' && <Image src={PencilIcon} alt='' width={18} height={18} />}
  </button>
)

/** The V1 / V2 chip next to a name. */
export const VersionBadge: React.FC<{ version: number }> = ({ version }) => (
  <span className='bg-tertiary text-foreground inline-flex h-4.5 shrink-0 items-center rounded-sm px-1.25 text-sm leading-3.5 font-bold'>
    V{version}
  </span>
)

export const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`

/** "a", "a and b", "a, b and c". */
export const formatList = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

export const shortAddress = (address: string) =>
  address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
