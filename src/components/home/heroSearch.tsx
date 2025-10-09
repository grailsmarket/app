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
    <div className='flex items-center gap-4 w-1/2'>
      <Searchbar className='h-12 scale-[1.01] w-full border-2 border-primary/20' onSearch={openSearchModal} />
      <PrimaryButton className='h-12 w-36 font-sedan-sc text-2xl font-medium' onClick={openSearchModal}>Search</PrimaryButton>
    </div>
  )
}

export default HeroSearch
