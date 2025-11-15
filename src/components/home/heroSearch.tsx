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
    <div className='flex w-full max-w-[380px] items-center gap-4 sm:w-3/4 md:w-1/2 md:max-w-[500px]'>
      <Searchbar className='border-primary/20 h-10 w-full scale-[1.01] border-2 md:h-12' onSearch={openSearchModal} />
      <PrimaryButton
        className='font-sedan-sc h-10 w-28 text-xl font-medium md:h-12 md:w-36 md:text-2xl'
        onClick={openSearchModal}
      >
        Search
      </PrimaryButton>
    </div>
  )
}

export default HeroSearch
