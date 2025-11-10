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
    <div className='flex w-full items-center gap-4 sm:w-3/4 md:w-1/2'>
      <Searchbar className='border-primary/20 h-12 w-full scale-[1.01] border-2' onSearch={openSearchModal} />
      <PrimaryButton className='font-sedan-sc h-12 w-36 text-2xl font-medium' onClick={openSearchModal}>
        Search
      </PrimaryButton>
    </div>
  )
}

export default HeroSearch
