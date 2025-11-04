'use client'

import React from 'react'
import { Address } from 'viem'
import { FullWidthProfile } from 'ethereum-identity-kit'
import MainPanel from './main-panel'
import { useUserContext } from '@/context/user'

interface Props {
  user: Address | string
}

const Profile: React.FC<Props> = ({ user }) => {
  const { userAddress } = useUserContext()

  return (
    <div className='dark'>
      <FullWidthProfile
        connectedAddress={userAddress}
        addressOrName={user}
        showPoaps={false}
        showFollowButton={true}
        style={{ paddingBottom: '80px', transform: 'translateY(80px)', position: 'relative' }}
      />
      <MainPanel user={user} />
    </div>
  )
}

export default Profile
