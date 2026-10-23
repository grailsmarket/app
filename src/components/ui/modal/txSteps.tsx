'use client'

import React from 'react'
import { motion } from 'motion/react'
import { Check } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import TxLink from './txLink'
import { MODAL_EASE_OUT } from './modalShell'

export type TxStepStatus = 'upcoming' | 'active' | 'done' | 'failed'

export interface TxStep {
  key: string
  label: React.ReactNode
  status: TxStepStatus
  /** Shown under the active or failed step. */
  detail?: React.ReactNode
  hash?: string | null
  href?: string
  linkLabel?: React.ReactNode
  /** Batch counter, e.g. "2 / 3". */
  batch?: React.ReactNode
  /** A small control at the end of the row, such as Retry. */
  action?: React.ReactNode
  /** One pill per finished batch, under the label. */
  links?: { key: string; hash: string; href?: string; label?: React.ReactNode }[]
}

interface TxStepsProps {
  steps: TxStep[]
  title?: React.ReactNode
  className?: string
}

const TxSteps: React.FC<TxStepsProps> = ({ steps, title, className }) => {
  return (
    <section className={cn('flex flex-col gap-2', className)}>
      {title && <h3 className='font-sedan-sc text-neutral text-lg tracking-wide'>{title}</h3>}
      <ol className='flex flex-col gap-1'>
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.key}
              aria-current={step.status === 'active' ? 'step' : undefined}
              className={cn(
                'relative flex items-start gap-3 rounded-lg p-2 transition-colors duration-300',
                step.status === 'active' && 'bg-primary-soft',
                step.status === 'failed' && 'bg-red-900/20'
              )}
            >
              {!isLast && (
                <span
                  aria-hidden='true'
                  className='bg-tertiary absolute top-9 left-4.75 h-[calc(100%-28px)] w-0.5 overflow-hidden rounded-full'
                >
                  <motion.span
                    className='bg-primary absolute inset-0 origin-top'
                    initial={false}
                    animate={{ scaleY: step.status === 'done' ? 1 : 0 }}
                    transition={{ duration: 0.48, ease: MODAL_EASE_OUT }}
                  />
                </span>
              )}

              <span
                aria-hidden='true'
                className={cn(
                  'relative grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors duration-300',
                  step.status === 'done' && 'bg-primary border-primary text-background',
                  step.status === 'active' && 'border-primary-line bg-background',
                  step.status === 'failed' && 'text-background border-red-400 bg-red-400',
                  step.status === 'upcoming' && 'border-tertiary bg-background text-neutral'
                )}
              >
                {step.status === 'done' && (
                  <motion.span initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                    <Check className='h-3 w-3' />
                  </motion.span>
                )}
                {step.status === 'failed' && '!'}
                {step.status === 'upcoming' && index + 1}
                {step.status === 'active' && (
                  <span className='border-primary absolute -inset-0.5 animate-spin rounded-full border-2 border-r-transparent border-b-transparent [animation-duration:0.9s] motion-reduce:[animation-duration:2.4s]' />
                )}
              </span>

              {/* The label keeps its width; hash pills that don't fit beside it wrap to their own line, right-aligned. */}
              <div className='flex min-w-0 flex-1 flex-row flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-0.5'>
                <span
                  className={cn(
                    'max-w-full shrink-0 text-lg transition-colors duration-300',
                    step.status === 'upcoming' && 'text-neutral',
                    step.status === 'active' && 'font-semibold',
                    step.status === 'failed' && 'font-semibold text-red-400'
                  )}
                >
                  {step.label}
                  <span className='sr-only'> ({step.status})</span>
                </span>
                {/* {showDetail && <span className='text-neutral text-md'>{step.detail}</span>} */}
                {step.links && step.links.length > 0 && (
                  <div className='ml-auto flex flex-wrap justify-end gap-1.5'>
                    {step.links.map((link) => (
                      <TxLink key={link.key} hash={link.hash} href={link.href} />
                    ))}
                  </div>
                )}
              </div>

              {(step.batch || step.hash || step.href || step.action) && (
                <div className='flex min-h-6 shrink-0 items-center gap-2'>
                  {step.batch && <span className='text-neutral text-sm font-bold tabular-nums'>{step.batch}</span>}
                  {(step.hash || step.href) && <TxLink hash={step.hash} href={step.href} />}
                  {step.action}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default TxSteps
