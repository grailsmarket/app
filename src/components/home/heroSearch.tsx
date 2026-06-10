'use client'

import React from 'react'
import { useAppDispatch } from '@/state/hooks'
import { setSearchModalOpen } from '@/state/reducers/modals/searchModal'
import Searchbar from '../ui/searchbar'
import PrimaryButton from '../ui/buttons/primary'

const HeroSearch: React.FC = () => {
  const dispatch = useAppDispatch()

  const openSearchModal = () => {
    dispatch(setSearchModalOpen(true))
  }

  return (
    <div className='flex w-full max-w-[410px] items-center gap-0 @[48rem]/app:max-w-[540px]'>
      <Searchbar
        className='border-primary/20 @[40rem]/app:px-lg h-10 w-full scale-[1.01] rounded-r-none border-2 px-3 text-lg @[40rem]/app:text-xl @[48rem]/app:h-12'
        placeholder='Search names, profiles, and categories...'
        onSearch={openSearchModal}
      />
      <PrimaryButton
        className='font-sedan-sc h-10 w-24 rounded-l-none text-xl font-medium @[40rem]/app:w-28 @[48rem]/app:h-12 @[48rem]/app:w-36 @[48rem]/app:text-2xl'
        onClick={openSearchModal}
      >
        Search
      </PrimaryButton>
    </div>
  )
}

export default HeroSearch
