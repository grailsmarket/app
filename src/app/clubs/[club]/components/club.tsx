'use client'

import React from 'react'
import MainPanel from './main-panel'
import { useCategories } from '@/components/filters/hooks/useCategories'
import ClubDetails from './clubDetails'

interface Props {
  club: string
}

const ClubPage: React.FC<Props> = ({ club }) => {
  const { categories: clubs } = useCategories()
  const clubDetails = clubs?.find((c) => c.name === club)

  if (!clubDetails) {
    return (
      <div className='w-full items-center justify-center pt-40'>
        <p className='text-2xl font-bold'>Club not found</p>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col'>
      <ClubDetails clubDetails={clubDetails} />
      <MainPanel club={club} />
    </div>
  )
}

export default ClubPage
