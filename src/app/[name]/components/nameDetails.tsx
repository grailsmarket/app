import { DOMAIN_IMAGE_URL } from '@/constants'
import Image from 'next/image'
import React, { ReactNode, useState } from 'react'
import { Address, numberToHex } from 'viem'
import LoadingCell from '@/components/ui/loadingCell'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import User from '@/components/ui/user'
import CopyIcon from 'public/icons/copy.svg'
import CheckIcon from 'public/icons/check.svg'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { UNREGISTERED } from '@/constants/domains/registrationStatuses'
import Price from '@/components/ui/price'

type Row = {
  label: string
  value: string | number | ReactNode | null | undefined
  canCopy: boolean
}

interface NameDetailsProps {
  name: string
  nameDetails: MarketplaceDomainType | undefined
  nameDetailsIsLoading: boolean
  registrationStatus: RegistrationStatus
}

const NameDetails: React.FC<NameDetailsProps> = ({ name, nameDetails, nameDetailsIsLoading, registrationStatus }) => {
  const rows: Row[] = [
    {
      label: 'Name',
      value: name,
      canCopy: true,
    },
    {
      label: 'Owner',
      value:
        nameDetails?.owner && registrationStatus !== UNREGISTERED ? (
          <User address={nameDetails?.owner as `0x${string}`} />
        ) : null,
      canCopy: false,
    },
    // {
    //   label: 'Created',
    //   value: nameDetails?.registration_date ? formatExpiryDate(nameDetails.registration_date) : null,
    //   canCopy: false,
    // },
    {
      label: 'Club',
      value: nameDetails?.clubs?.join(', ') || 'None',
      canCopy: false,
    },
    {
      label: 'Last Sale',
      value: nameDetails?.last_sale_price ? (
        <Price
          price={nameDetails?.last_sale_price}
          currencyAddress={nameDetails?.last_sale_currency as Address}
          iconSize='24px'
          fontSize='text-xl font-semibold'
          alignTooltip='right'
        />
      ) : (
        'N/A'
      ),
      canCopy: false,
    },
    {
      label: 'Expires',
      value: nameDetails?.expiry_date ? formatExpiryDate(nameDetails.expiry_date) : null,
      canCopy: false,
    },
    {
      label: 'Token ID',
      value: nameDetails?.token_id,
      canCopy: true,
    },
    {
      label: 'Namehash',
      value: numberToHex(nameDetails?.token_id ?? 0),
      canCopy: true,
    },
  ]

  return (
    <div className='flex flex-col'>
      <div>
        {nameDetails?.token_id && (
          <Image
            unoptimized
            src={`${DOMAIN_IMAGE_URL}/${numberToHex(nameDetails.token_id)}/image`}
            alt={nameDetails.name}
            width={600}
            height={600}
            className='aspect-square h-full w-full'
          />
        )}
        {nameDetailsIsLoading && <LoadingCell height='100%' width='100%' className='aspect-square' />}
      </div>
      <div className='p-lg lg:p-xl flex flex-col items-center gap-3'>
        {rows.map((row) => (
          <div key={row.label} className='flex w-full flex-row items-center justify-between gap-2'>
            <p className='font-sedan-sc text-2xl'>{row.label}</p>
            {typeof row.value === 'string' ? (
              <CopyValue value={row.value} canCopy={row.canCopy} />
            ) : (
              <div className='max-w-2/3'>{row.value}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const CopyValue = ({ value, canCopy }: { value: string; canCopy: boolean }) => {
  const [isCopied, setIsCopied] = useState(false)
  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <div
      className='flex max-w-1/2 cursor-pointer flex-row items-center gap-1'
      onClick={() => {
        if (canCopy) handleCopy(value)
      }}
    >
      <p className='max-w-full truncate text-xl'>{value}</p>
      {canCopy && <Image src={isCopied ? CheckIcon : CopyIcon} alt='Copy' className='h-4 w-4' />}
    </div>
  )
}

export default NameDetails
