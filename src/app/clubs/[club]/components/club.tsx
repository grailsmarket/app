'use client'

import React from 'react'
import MainPanel from './main-panel'

interface Props {
  club: string
}

const ClubPage: React.FC<Props> = ({ club }) => {
  return (
    <div className='dark pt-20'>
      <p className='text-2xl font-bold'>{club}</p>
      <MainPanel club={club} />
    </div>
  )
}

export default ClubPage
