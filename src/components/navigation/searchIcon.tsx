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
    <button
      type='button'
      onClick={handleClick}
      aria-label='Open search'
      className='flex shrink-0 cursor-pointer items-center justify-center rounded-md lg:hidden'
    >
      <Image src={search} alt='Search' width={24} height={24} className='h-5 w-5 md:h-6 md:w-6' />
    </button>
  )
}

export default SearchIcon
