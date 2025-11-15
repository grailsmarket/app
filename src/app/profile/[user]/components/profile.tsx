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
    <div className='dark relative z-0 md:pt-20 pt-16'>
      <div className='z-20 w-full'>
        <FullWidthProfile
          connectedAddress={userAddress}
          addressOrName={user}
          showPoaps={false}
          showFollowButton={true}
          style={{ paddingLeft: '10px' }}
        // style={{ paddingBottom: '60px', transform: 'translateY(80px)' }}
        />
      </div>
      <div>
        <MainPanel user={user} />
      </div>
    </div>
  )
}

export default Profile
