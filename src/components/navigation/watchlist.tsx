import Image from 'next/image'
import React from 'react'
import watchlist from 'public/icons/watchlist.svg'
import { useAppDispatch } from '@/state/hooks'
import { changeTab } from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'
import Link from 'next/link'

const Watchlist = () => {
  const dispatch = useAppDispatch()
  const { authStatus, userAddress } = useUserContext()

  if (!userAddress || authStatus !== 'authenticated') return null

  const handleClick = () => {
    dispatch(
      changeTab({
        label: 'Watchlist',
        value: 'watchlist',
      })
    )
  }

  return (
    <Link
      href={`/profile/${userAddress}?tab=watchlist`}
      onClick={handleClick}
      className='hover:bg-primary/10 cursor-pointer rounded-md p-1 transition-all'
    >
      <Image src={watchlist} alt='Watchlist' width={30} height={30} className='h-6 w-6 scale-120' />
    </Link>
  )
}

export default Watchlist
