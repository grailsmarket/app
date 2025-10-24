import { DOMAIN_IMAGE_URL } from '@/constants'
import Image from 'next/image'
import React from 'react'
import { numberToHex } from 'viem'
import LoadingCell from '@/components/ui/loadingCell'
import { truncateAddress } from 'ethereum-identity-kit'
import { MarketplaceDomainType } from '@/types/domains'

interface NameDetailsProps {
  name: string
  nameDetails: MarketplaceDomainType | undefined
  nameDetailsIsLoading: boolean
}

const NameDetails: React.FC<NameDetailsProps> = ({ name, nameDetails, nameDetailsIsLoading }) => {

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
      <div className='p-lg flex flex-col gap-2'>
        <div className='flex w-full flex-row justify-between gap-2'>
          <p className='font-sedan-sc text-lg font-bold'>Name</p>
          <p className='text-lg'>{name}</p>
        </div>
        <div className='flex w-full flex-row justify-between gap-2'>
          <p className='font-sedan-sc text-lg font-bold'>Owner</p>
          <p className='text-lg'>{truncateAddress(nameDetails?.owner ?? '0x000000000000000000000000000000000')}</p>
        </div>
        <div className='flex w-full flex-row justify-between gap-2'>
          <p className='font-sedan-sc text-lg font-bold'>Created</p>
          <p className='text-lg'>{nameDetails?.registration_date}</p>
        </div>
        <div className='flex w-full flex-row justify-between gap-2'>
          <p className='font-sedan-sc text-lg font-bold'>Expires</p>
          <p className='max-w-1/2 overflow-hidden text-lg overflow-ellipsis'>{nameDetails?.expiry_date}</p>
        </div>
        <div className='flex w-full flex-row justify-between gap-2'>
          <p className='font-sedan-sc text-lg font-bold'>Token ID</p>
          <p className='max-w-1/2 overflow-hidden text-lg overflow-ellipsis'>{nameDetails?.token_id}</p>
        </div>
        <div className='flex w-full flex-row justify-between gap-2'>
          <p className='font-sedan-sc text-lg font-bold'>Namehash</p>
          <p className='max-w-1/2 overflow-hidden text-lg overflow-ellipsis'>
            {numberToHex(nameDetails?.token_id ?? 0)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default NameDetails
