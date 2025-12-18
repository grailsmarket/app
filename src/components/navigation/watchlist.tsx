import Image from 'next/image'
import React from 'react'
import watchlist from 'public/icons/watchlist.svg'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/state/hooks'
import { changeTab } from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'

const Watchlist = () => {
  const router = useRouter()
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
    router.push(`/profile/${userAddress}`)
  }

  return (
    <button onClick={handleClick} className='hover:bg-primary/10 cursor-pointer rounded-md p-1 transition-all'>
      <Image src={watchlist} alt='Watchlist' width={30} height={30} className='h-6 w-6 scale-120' />
    </button>
  )
}

export default Watchlist
