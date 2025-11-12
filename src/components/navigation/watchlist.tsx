import Image from 'next/image'
import React from 'react'
import watchlist from 'public/icons/watchlist.svg'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/state/hooks'
import { changeTab } from '@/state/reducers/portfolio/profile'

const Watchlist = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()

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
      <Image src={watchlist} alt='Watchlist' width={30} height={30} />
    </button>
  )
}

export default Watchlist
