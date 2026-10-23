'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import SecondaryButton from '@/components/ui/buttons/secondary'
import CopyButton from '@/components/ui/copyButton'
import EtherscanLogo from 'public/logos/etherscan.svg'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { cn } from '@/utils/tailwind'
import { useResolverPreferences } from '@/hooks/settings/useResolverPreferences'
import { resolverLabel } from '@/utils/settings/labels'

export const resolverPath = (address: string) => `/settings/resolvers/${address}`
export const configurationPath = (address: string, id: string | bigint) => `/settings/records/${address}/${id}`
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

interface SettingsNoticeProps {
  children: React.ReactNode
  error?: boolean
  className?: string
}

export const SettingsNotice = ({ children, error = false, className }: SettingsNoticeProps) => (
  <div
    role={error ? 'alert' : 'status'}
    className={cn(
      'bg-secondary border-tertiary rounded-md border p-3 text-lg',
      error ? 'text-red-400' : 'text-neutral',
      className
    )}
  >
    {children}
  </div>
)

interface ResolverAddressProps {
  address: Address
  name?: string | null
  link?: boolean
  truncate?: boolean
  canCopy?: boolean
  etherscan?: boolean
  textColor?: string
  showLabel?: boolean
  preferred?: boolean
}

export const ResolverAddress: React.FC<ResolverAddressProps> = ({
  address,
  name,
  link = false,
  truncate = true,
  canCopy = true,
  etherscan = true,
  textColor,
  showLabel = true,
  preferred = false,
}) => {
  const addressValue = truncate ? shortAddress(address) : address
  const preferences = useResolverPreferences(showLabel)
  const label = showLabel ? (name ?? resolverLabel(preferences.data, address)) : null
  const addressText = label ? '(' + addressValue + ')' : addressValue
  const iconSize = label ? 14 : 16

  return (
    <div className='flex min-w-0 items-center gap-1.5'>
      {label &&
        (link ? (
          <Link className='hover:text-primary truncate text-lg font-semibold' href={resolverPath(address)}>
            {label}
          </Link>
        ) : (
          <p className='truncate text-lg font-semibold'>{label}</p>
        ))}
      <div className={cn('flex items-center gap-1.5', label ? 'text-md' : 'text-lg')}>
        <Link
          href={resolverPath(address)}
          title={address}
          onClick={(e) => {
            if (!link) e.preventDefault()
          }}
          className={cn('text-neutral truncate', textColor, link && 'hover:text-foreground', label && 'pt-0.5')}
        >
          {addressText}
        </Link>
        {preferred && (
          <svg
            viewBox='0 0 24 24'
            fill='currentColor'
            className='text-primary h-4.5 w-4.5'
            role='img'
            aria-label='Preferred resolver'
          >
            <title>Preferred resolver</title>
            <path d='m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z' />
          </svg>
        )}
        {canCopy && <CopyButton value={address} size={iconSize} />}
        {etherscan && (
          <a
            href={`${activeChain.blockExplorers.default.url}/address/${address}`}
            target='_blank'
            rel='noreferrer'
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${address} on explorer`}
            className='flex shrink-0 items-center justify-center opacity-70 transition-opacity hover:opacity-100'
          >
            <Image src={EtherscanLogo} alt='' width={iconSize} height={iconSize} />
          </a>
        )}
      </div>
    </div>
  )
}

export const QueryError = ({ error, retry }: { error: unknown; retry?: () => void }) => (
  <SettingsNotice error>
    <div className='flex flex-col gap-3'>
      <p>{roleErrorText(error)}</p>
      {retry && <SecondaryButton onClick={retry}>Retry</SecondaryButton>}
    </div>
  </SettingsNotice>
)

export const tableClass = 'w-full text-left text-lg [&>tbody>tr:last-child>td]:border-b-0'
export const thClass = 'text-neutral border-tertiary border-b px-2.5 sm:px-4 pb-3 font-medium whitespace-nowrap'
export const trClass = (index: number, list: any[]) =>
  cn('cursor-pointer border-tertiary', index + 1 < (list?.length ?? 0) && 'border-b')
export const tdClass = 'px-2.5 sm:px-4 py-4 align-middle'
export const secondaryLinkClass =
  'bg-tertiary text-foreground px-lg flex h-9 w-fit items-center justify-center rounded-sm text-lg font-bold transition-all hover:bg-[#4B4B4B] active:scale-95 @[48rem]/app:h-10'
export const primaryLinkClass =
  'bg-primary text-background px-lg flex h-9 w-fit items-center justify-center rounded-sm text-lg font-bold transition-all hover:opacity-70 active:scale-95'
