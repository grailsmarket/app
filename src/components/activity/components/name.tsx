import { DOMAIN_IMAGE_URL } from '@/constants'
import Image from 'next/image'
import React from 'react'
import { numberToHex } from 'viem'

interface NameProps {
  name: string
  tokenId: string
}

const Name: React.FC<NameProps> = ({ name, tokenId }) => {
  return (
    <div className='flex h-[36px] flex-col justify-center w-full'>
      <div className='flex w-full max-w-full flex-row items-center justify-start gap-2'>
        <Image
          src={`${DOMAIN_IMAGE_URL}/${numberToHex(BigInt(tokenId))}/image`}
          unoptimized
          alt='icon'
          width={30}
          height={30}
          className='h-8 w-8 rounded-sm'
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <p className='truncate text-xs leading-[18px] font-bold' >
          {name}
        </p>
      </div>
    </div>
  )
}

export default Name
