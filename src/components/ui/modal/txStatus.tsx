'use client'

import React from 'react'
import { motion } from 'motion/react'
import StatusOrb, { type TxState } from './statusOrb'
import { MODAL_EASE_OUT } from './modalShell'

interface TxStatusProps {
  state: TxState
  /** What is happening, or what to do: "Confirm in Wallet". */
  title: string
  message?: React.ReactNode
  seconds?: number
  total?: number
  /** Usually a TxLink. */
  children?: React.ReactNode
}

const TxStatus: React.FC<TxStatusProps> = ({ state, title, message, seconds, total, children }) => {
  return (
    <div role='status' aria-live='polite' className='flex flex-col items-center gap-3 pt-6 pb-2 text-center'>
      <StatusOrb state={state} seconds={seconds} total={total} className='mb-2' />
      <motion.h3
        key={title}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: MODAL_EASE_OUT }}
        className='text-2xl font-bold'
      >
        {title}
      </motion.h3>
      {message && <p className='text-neutral -mt-1.5 max-w-80 text-lg'>{message}</p>}
      {children}
    </div>
  )
}

export default TxStatus
