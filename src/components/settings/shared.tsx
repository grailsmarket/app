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

export const resolverPath = (address: string) => `/settings/resolvers/${address}`
export const configurationPath = (address: string, id: string | bigint) => `/settings/records/${address}/${id}`
export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

export const SettingsNotice = ({ children, error = false }: { children: React.ReactNode; error?: boolean }) => (
  <div
    role={error ? 'alert' : 'status'}
    className={`bg-secondary border-tertiary rounded-md border p-3 text-lg ${error ? 'text-red-400' : 'text-neutral'}`}
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
}

export const ResolverAddress: React.FC<ResolverAddressProps> = ({
  address,
  name,
  link = false,
  truncate = true,
  canCopy = true,
  etherscan = true,
  textColor,
}) => {
  return (
    <div className='flex min-w-0 flex-col gap-1'>
      {name &&
        (link ? (
          <Link className='hover:text-primary truncate text-lg font-semibold' href={resolverPath(address)}>
            {name}
          </Link>
        ) : (
          <p className='truncate text-lg font-semibold'>{name}</p>
        ))}
      <div className='flex items-center gap-1 text-lg'>
        <Link
          href={resolverPath(address)}
          title={address}
          onClick={(e) => {
            if (!link) e.preventDefault()
          }}
          className={cn('text-neutral truncate', textColor, link && 'hover:text-foreground')}
        >
          {truncate ? shortAddress(address) : address}
        </Link>
        {canCopy && <CopyButton value={address} />}
        {etherscan && (
          <a
            href={`${activeChain.blockExplorers.default.url}/address/${address}`}
            target='_blank'
            rel='noreferrer'
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${address} on explorer`}
            className='flex h-6 w-6 shrink-0 items-center justify-center opacity-70 transition-opacity hover:opacity-100'
          >
            <Image src={EtherscanLogo} alt='' width={16} height={16} />
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
  'bg-primary text-background px-lg flex h-9 w-fit items-center justify-center rounded-sm text-lg font-bold transition-all hover:opacity-70 active:scale-95 @[48rem]/app:h-10'
