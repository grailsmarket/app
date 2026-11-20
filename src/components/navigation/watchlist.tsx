import Image from 'next/image'
import React from 'react'
import watchlist from 'public/icons/watchlist.svg'
import { useUserContext } from '@/context/user'
import Link from 'next/link'

const Watchlist = () => {
  const { authStatus, userAddress } = useUserContext()
  if (!userAddress || authStatus !== 'authenticated') return null

  return (
    <Link
      href={`/profile/${userAddress}?tab=watchlist`}
      className='flex shrink-0 cursor-pointer items-center justify-center rounded-md'
      aria-label='Open watchlist'
    >
      <Image src={watchlist} alt='Watchlist' width={30} height={30} className='h-6 w-6 scale-120' />
    </Link>
  )
}

export default Watchlist
