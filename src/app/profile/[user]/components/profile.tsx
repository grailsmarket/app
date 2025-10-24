'use client'

import React from 'react'
import { Address } from 'viem'
import { FullWidthProfile } from 'ethereum-identity-kit'
import MainPanel from './main-panel'

interface Props {
  user: Address | string
}

const Profile: React.FC<Props> = ({ user }) => {
  return (
    <div className='dark'>
      <FullWidthProfile
        addressOrName={user}
        style={{ paddingBottom: '80px', transform: 'translateY(80px)', position: 'relative' }}
      />
      <MainPanel user={user} />
    </div>
  )
}

export default Profile
