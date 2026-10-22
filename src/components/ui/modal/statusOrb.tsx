'use client'

import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/utils/tailwind'
import { BangIcon, EthIcon, SearchIcon, WalletIcon } from './icons'
import { MODAL_EASE_OUT } from './modalShell'

export type TxState = 'wallet' | 'pending' | 'checking' | 'waiting' | 'ready' | 'success' | 'error'

interface StatusOrbProps {
  state: TxState
  /** waiting only: seconds left */
  seconds?: number
  /** waiting only: length of the whole wait */
  total?: number
  className?: string
}

const RING_RADIUS = 48.5
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

const StatusOrb: React.FC<StatusOrbProps> = ({ state, seconds, total = 60, className }) => {
  const reduceMotion = useReducedMotion()
  const isSpinning = state === 'pending' || state === 'checking'
  const secondsLeft = Math.max(0, Math.min(total, seconds ?? total))

  return (
    <div
      aria-hidden='true'
      className={cn(
        'text-primary relative grid shrink-0 place-items-center',
        state === 'waiting' ? 'h-28 w-28' : 'h-18 w-18',
        state === 'error' && 'text-red-400',
        className
      )}
    >
      <motion.div
        className={cn(
          'pointer-events-none absolute -inset-[60%] rounded-full',
          state === 'error'
            ? 'bg-[radial-gradient(circle,rgb(130_24_26/0.25)_0%,transparent_70%)]'
            : 'bg-[radial-gradient(circle,var(--primary-glow)_0%,transparent_70%)]'
        )}
        animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7], scale: [0.94, 1.04, 0.94] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        key={state === 'success' || state === 'error' ? state : 'progress'}
        initial={state === 'success' && !reduceMotion ? { scale: 0.6, opacity: 0 } : false}
        animate={
          state === 'error' && !reduceMotion
            ? { x: [0, -5, 5, -3, 3, 0] }
            : { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 18 } }
        }
        transition={{ duration: 0.42, ease: MODAL_EASE_OUT }}
        className={cn(
          'relative grid h-full w-full place-items-center rounded-full border transition-colors duration-300',
          state === 'success'
            ? 'bg-primary border-primary text-background shadow-bulk'
            : state === 'error'
              ? 'border-red-500/20 bg-red-900/20'
              : state === 'ready'
                ? 'bg-secondary border-primary-line shadow-bulk'
                : 'bg-secondary border-line-subtle'
        )}
      >
        {state === 'wallet' &&
          !reduceMotion &&
          [0, 1.1].map((delay) => (
            <motion.span
              key={delay}
              className='border-primary absolute -inset-px rounded-full border-[1.5px]'
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: [0.7, 0], scale: [1, 1.45] }}
              transition={{ duration: 2.2, delay, repeat: Infinity, ease: MODAL_EASE_OUT }}
            />
          ))}
        {state === 'success' && !reduceMotion && (
          <motion.span
            className='border-primary absolute -inset-px rounded-full border-2'
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.45 }}
            transition={{ duration: 0.9, delay: 0.2, ease: MODAL_EASE_OUT }}
          />
        )}

        {state === 'waiting' ? (
          <div className='text-foreground flex flex-col items-center'>
            <span className='text-4xl leading-none font-bold tabular-nums'>{Math.ceil(secondsLeft)}</span>
            <span className='text-neutral mt-1 text-sm font-semibold tracking-wider'>SECONDS</span>
          </div>
        ) : state === 'success' || state === 'ready' ? (
          <svg viewBox='0 0 24 24' className='h-7.5 w-7.5' fill='none' stroke='currentColor' strokeWidth={2.5}>
            <motion.path
              d='M5 12.5l4.5 4.5L19 7'
              strokeLinecap='round'
              strokeLinejoin='round'
              initial={reduceMotion || state === 'ready' ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.42, delay: 0.24, ease: MODAL_EASE_OUT }}
            />
          </svg>
        ) : state === 'error' ? (
          <BangIcon className='h-7.5 w-7.5' />
        ) : state === 'wallet' ? (
          <motion.span
            animate={reduceMotion ? undefined : { y: [0, 0, -3, 0, 0] }}
            transition={{ duration: 2.2, times: [0, 0.7, 0.8, 0.9, 1], repeat: Infinity }}
          >
            <WalletIcon className='h-7.5 w-7.5' />
          </motion.span>
        ) : state === 'checking' ? (
          <SearchIcon className='h-7.5 w-7.5' />
        ) : (
          <EthIcon className='h-7.5 w-7.5' />
        )}
      </motion.div>

      {(isSpinning || state === 'waiting' || state === 'ready') && (
        <svg
          viewBox='0 0 100 100'
          className={cn(
            'pointer-events-none absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] -rotate-90',
            isSpinning && 'animate-spin [animation-duration:1.1s] motion-reduce:[animation-duration:2.4s]'
          )}
        >
          <circle
            cx='50'
            cy='50'
            r={RING_RADIUS}
            fill='none'
            strokeWidth={state === 'waiting' ? 4 : 3}
            className='stroke-tertiary'
          />
          <circle
            cx='50'
            cy='50'
            r={RING_RADIUS}
            fill='none'
            strokeWidth={state === 'waiting' ? 4 : 3}
            strokeLinecap='round'
            strokeDasharray={isSpinning ? `${RING_CIRCUMFERENCE * 0.26} ${RING_CIRCUMFERENCE}` : RING_CIRCUMFERENCE}
            strokeDashoffset={state === 'waiting' ? RING_CIRCUMFERENCE * (secondsLeft / total) : 0}
            className='stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear'
          />
        </svg>
      )}
    </div>
  )
}

export default StatusOrb
