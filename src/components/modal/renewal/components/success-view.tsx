'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Check } from 'ethereum-identity-kit'
import NameImage from '@/components/ui/nameImage'
import StatusOrb from '@/components/ui/modal/statusOrb'
import TxLink from '@/components/ui/modal/txLink'
import { MODAL_EASE_OUT } from '@/components/ui/modal/modalShell'
import { beautifyName } from '@/lib/ens'
import type { RenewalSubjectDomain } from './renewal-subject'
import { formatExpiryDate } from './renewal-format'

export interface RenewalLink {
  key: string
  hash: string
  href: string
}

interface SuccessViewProps {
  domains: RenewalSubjectDomain[]
  /** One name only: its expiry after the renewal, in ms. */
  newExpiry: number | null
  links: RenewalLink[]
}

// One name: its card with the success mark on its corner. Several: the success orb and the count.
// Then one link per transaction.
const SuccessView: React.FC<SuccessViewProps> = ({ domains, newExpiry, links }) => {
  const reduceMotion = useReducedMotion()
  const domain = domains.length === 1 ? domains[0] : null
  const name = domain ? beautifyName(domain.name) : null

  return (
    <div role='status' className='flex flex-col items-center gap-3 pt-2 text-center'>
      {domain ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className='relative my-3'
        >
          <div className='pointer-events-none absolute inset-[-40%] rounded-full bg-[radial-gradient(circle,var(--primary-glow)_0%,transparent_70%)]' />
          <NameImage
            name={domain.name}
            tokenId={domain.token_id}
            version={domain.version}
            expiryDate={newExpiry ? new Date(newExpiry).toISOString() : domain.expiry_date}
            className='shadow-modal h-42 w-42 rounded-lg'
            height={168}
            width={168}
          />
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
        <StatusOrb state='success' className='my-2' />
      )}
      <h3 className='text-2xl font-bold'>Extension Successful</h3>
      <p className='text-neutral -mt-1.5 max-w-80 text-lg'>
        {domain
          ? newExpiry
            ? `${name} now expires ${formatExpiryDate(newExpiry)}.`
            : `${name} has been extended.`
          : `${domains.length} names extended`}
      </p>
      {links.length > 0 && (
        <div className='flex flex-wrap justify-center gap-1.5'>
          {links.map((link, index) => (
            <TxLink
              key={link.key}
              hash={link.hash}
              href={link.href}
              label={links.length > 1 ? `Transaction ${index + 1}` : 'View on Etherscan'}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default SuccessView
