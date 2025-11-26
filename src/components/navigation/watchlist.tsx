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
  const { authStatus } = useUserContext()

  if (authStatus !== 'authenticated') return null

  const handleClick = () => {
    dispatch(
      changeTab({
        label: 'Watchlist',
        value: 'watchlist',
      })
    )
    router.push('/portfolio')
  }

  return (
    <button onClick={handleClick} className='cursor-pointer transition-all hover:opacity-80'>
      <Image src={watchlist} alt='Watchlist' width={30} height={30} className='h-6 w-6 md:h-7 md:w-7' />
    </button>
  )
}

export default Watchlist
