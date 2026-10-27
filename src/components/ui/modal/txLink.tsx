import React from 'react'
import { activeChain } from '@/constants/web3/chain'
import { cn } from '@/utils/tailwind'
import { ExternalLinkIcon } from './icons'

interface TxLinkProps {
  label?: string | null
  hash?: string | null
  href?: string
  className?: string
}

export const shortenHash = (hash: string) => (hash.length > 12 ? `${hash.slice(0, 6)}…${hash.slice(-4)}` : hash)

const TxLink: React.FC<TxLinkProps> = ({ label, hash, href, className }) => {
  const url = href ?? (hash ? `${activeChain.blockExplorers.default.url}/tx/${hash}` : undefined)
  if (!url) return null

  return (
    <a
      href={url}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        'bg-secondary border-line-subtle text-primary hover:bg-tertiary hover:border-tertiary focus-visible:outline-primary text-md inline-flex h-6.5 shrink-0 items-center gap-1.5 rounded-full border px-2.5 font-mono whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
        className
      )}
    >
      {label && <span className='text-foreground font-sans font-semibold'>{label}</span>}
      {hash && <span>{shortenHash(hash)}</span>}
      <ExternalLinkIcon className='h-3 w-3' />
      <span className='sr-only'> (opens in a new tab)</span>
    </a>
  )
}

export default TxLink
