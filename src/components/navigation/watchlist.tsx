import Image from 'next/image'
import React from 'react'
import watchlist from 'public/icons/watchlist.svg'
import { useAppDispatch } from '@/state/hooks'
import { changeTab } from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const Watchlist = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { authStatus, userAddress } = useUserContext()
  if (!userAddress || authStatus !== 'authenticated') return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(
      changeTab({
        label: 'Watchlist',
        value: 'watchlist',
      })
    )
    router.push(`/profile/${userAddress}`)
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
