import React from 'react'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'

interface NameProps {
  name: string
  tokenId: string
}

const Name: React.FC<NameProps> = ({ name, tokenId }) => {
  return (
    <a href={`/${name}`} className='flex h-[36px] max-w-full flex-col justify-center hover:opacity-70'>
      <div className='flex w-full max-w-full flex-row items-center justify-start gap-2'>
        <NameImage name={name} tokenId={tokenId} expiryDate={null} className='h-8 w-8 rounded-sm' />
        <p className='text-md w-full max-w-full truncate leading-[18px] font-bold'>{beautifyName(name)}</p>
      </div>
    </a>
  )
}

export default Name
