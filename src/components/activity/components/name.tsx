import React from 'react'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import Link from 'next/link'
import { normalizeName } from '@/lib/ens'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import Image from 'next/image'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

interface NameProps {
  name: string
  tokenId: string
  clubs: string[]
}

const Name: React.FC<NameProps> = ({ name, tokenId, clubs }) => {
  return (
    <Link
      href={`/${normalizeName(name)}`}
      className='flex h-[36px] max-w-full flex-col justify-center hover:opacity-70'
    >
      <div className='flex w-full max-w-full flex-row items-center justify-start gap-2'>
        <NameImage name={name} tokenId={tokenId} expiryDate={null} className='h-8 w-8 rounded-sm' />
        <div className='flex max-w-[calc(100%-40px)] flex-col'>
          <p className='text-md w-full max-w-full truncate leading-[18px] font-bold'>{beautifyName(name)}</p>
          {clubs && clubs.length > 0 && (
            <div className='flex max-w-full flex-row items-center gap-1 truncate'>
              <div className='flex max-w-fit min-w-fit items-center gap-1'>
                <Image
                  src={getCategoryDetails(clubs[0]).avatar}
                  alt={clubs[0] as string}
                  width={16}
                  height={16}
                  className='rounded-full'
                />
                <p className='text-md text-neutral truncate font-semibold'>
                  {CATEGORY_LABELS[clubs[0] as keyof typeof CATEGORY_LABELS]}
                </p>
              </div>
              {clubs.length > 1 && (
                <p className='text-md text-neutral truncate pt-0.5 font-bold'>+{clubs.length - 1}</p>
              )}
            </div>
          )}{' '}
        </div>
      </div>
    </Link>
  )
}

export default Name
