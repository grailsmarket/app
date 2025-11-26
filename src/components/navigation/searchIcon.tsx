import React from 'react'
import Image from 'next/image'
import search from 'public/icons/search.svg'
import { useAppDispatch } from '@/state/hooks'
import { setSearchModalOpen } from '@/state/reducers/modals/searchModal'

const SearchIcon = () => {
  const dispatch = useAppDispatch()

  const handleClick = () => {
    dispatch(setSearchModalOpen(true))
  }

  return (
    <button onClick={handleClick} className='cursor-pointer transition-all hover:opacity-80 lg:hidden'>
      <Image src={search} alt='Search' width={24} height={24} className='h-5 w-5 md:h-6 md:w-6' />
    </button>
  )
}

export default SearchIcon
