'use client'

import React from 'react'
import { Address } from 'viem'
import { FullWidthProfile, useIsClient } from 'ethereum-identity-kit'
import MainPanel from './main-panel'
import { useUserContext } from '@/context/user'

interface Props {
  user: Address | string
}

const Profile: React.FC<Props> = ({ user }) => {
  const isClient = useIsClient()
  const { userAddress } = useUserContext()

  return (
    <div className='dark relative z-0 w-full'>
      <div className='z-20 w-full' suppressHydrationWarning={true}>
        {/* Issues inside of EIK, so having to render on the client */}
        {isClient && (
          <FullWidthProfile
            connectedAddress={userAddress}
            addressOrName={user}
            showPoaps={false}
            showFollowButton={true}
            style={{ paddingLeft: '10px' }}
            // style={{ paddingBottom: '60px', transform: 'translateY(80px)' }}
          />
        )}
      </div>
      <div className='w-screen'>
        <MainPanel user={user} />
      </div>
    </div>
  )
}

export default Profile
