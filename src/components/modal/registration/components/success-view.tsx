'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'ethereum-identity-kit'
import NameImage from '@/components/ui/nameImage'
import StatusOrb from '@/components/ui/modal/statusOrb'
import TxLink from '@/components/ui/modal/txLink'
import { MODAL_EASE_OUT } from '@/components/ui/modal/modalShell'
import { YEAR_IN_SECONDS } from '@/constants/time'
import { BatchState, CalculationResults, NameRegistrationEntry } from '@/types/registration'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import NameCarousel from './name-carousel'

interface SuccessViewProps {
  isBulk: boolean
  firstName: string | null
  firstDomain: NameRegistrationEntry['domain']
  availableEntries: NameRegistrationEntry[]
  batches: BatchState[]
  totalBatches: number
  calculationResults: CalculationResults | null
  /** Closes the modal when a name card is followed to its page. */
  onClose: () => void
}

const SuccessView: React.FC<SuccessViewProps> = ({
  isBulk,
  firstName,
  firstDomain,
  availableEntries,
  batches,
  totalBatches,
  calculationResults,
  onClose,
}) => {
  const reduceMotion = useReducedMotion()

  return (
    <div role='status' className='flex flex-col items-center gap-3 pt-2 text-center'>
      {!isBulk && firstName ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className='relative my-3'
        >
          <div className='pointer-events-none absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,var(--primary-glow)_0%,transparent_70%)]' />
          <HoverPrefetchLink
            href={`/${firstName}`}
            className='relative block transition-opacity hover:opacity-80'
            onClick={onClose}
          >
            <NameImage
              name={firstName}
              version={firstDomain.version}
              tokenId={firstDomain?.token_id}
              expiryDate={new Date(
                Number(calculationResults?.durationSeconds ?? BigInt(YEAR_IN_SECONDS)) * 1000 + Date.now()
              ).toISOString()}
              className='shadow-modal h-42 w-42 rounded-lg'
              height={168}
              width={168}
            />
          </HoverPrefetchLink>
          <motion.span
            initial={reduceMotion ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.42, ease: MODAL_EASE_OUT }}
            className='bg-primary text-background border-background shadow-bulk absolute -right-3 -bottom-3 grid h-10 w-10 place-items-center rounded-full border-3'
          >
            <Check className='h-4 w-4' />
          </motion.span>
        </motion.div>
      ) : (
        <>
          <NameCarousel entries={availableEntries} calculationResults={calculationResults} onClose={onClose} />
          <StatusOrb state='success' className='my-2' />
        </>
      )}
      <h3 className='text-2xl font-bold'>Registration Successful</h3>
      {isBulk && <p className='text-neutral -mt-1.5 text-lg'>{availableEntries.length} names registered</p>}
      <div className='flex flex-wrap justify-center gap-1.5'>
        {batches
          .filter((batch) => batch.registerTxHash)
          .map((batch, i) => (
            <TxLink
              key={batch.batchIndex}
              hash={batch.registerTxHash}
              label={totalBatches > 1 ? `Transaction ${i + 1}` : 'View Transaction on Etherscan'}
            />
          ))}
      </div>
    </div>
  )
}

export default SuccessView
