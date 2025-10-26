import { DOMAIN_IMAGE_URL } from '@/constants'
import Image from 'next/image'
import React, { useState } from 'react'
import { numberToHex } from 'viem'
import LoadingCell from '@/components/ui/loadingCell'
import { MarketplaceDomainType } from '@/types/domains'
import User from '@/components/ui/user'
import CopyIcon from 'public/icons/copy.svg'
import CheckIcon from 'public/icons/check.svg'

interface NameDetailsProps {
  name: string
  nameDetails: MarketplaceDomainType | undefined
  nameDetailsIsLoading: boolean
}

const NameDetails: React.FC<NameDetailsProps> = ({ name, nameDetails, nameDetailsIsLoading }) => {
  const rows = [
    {
      label: 'Name',
      value: name,
      canCopy: true,
    },
    {
      label: 'Owner',
      value: nameDetails?.owner,
      canCopy: false,
    },
    {
      label: 'Created',
      value: nameDetails?.registration_date,
      canCopy: false,
    },
    {
      label: 'Expires',
      value: nameDetails?.expiry_date,
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
      <div className='p-xl flex items-center flex-col gap-3'>
        {rows.map((row) => (
          <div key={row.label} className='flex w-full flex-row justify-between gap-2 items-center'>
            <p className='font-sedan-sc text-xl font-bold'>{row.label}</p>
            {row.label === 'Owner' && row.value ? <User address={row.value as `0x${string}`} /> : <CopyValue value={row.value as string} canCopy={row.canCopy} />}
          </div>
        ))}
      </div>
    </div>
  )
}

const CopyValue = ({ value, canCopy }: { value: string, canCopy: boolean }) => {
  const [isCopied, setIsCopied] = useState(false)
  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <div className='flex flex-row items-center gap-1 max-w-1/2 cursor-pointer' onClick={() => {
      if (canCopy) handleCopy(value)
    }}>
      <p className='text-lg max-w-full truncate'>{value}</p>
      {canCopy && <Image src={isCopied ? CheckIcon : CopyIcon} alt='Copy' className='w-4 h-4' />}
    </div>
  )
}

export default NameDetails
