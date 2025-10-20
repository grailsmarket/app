'use client'

import { FullWidthProfile } from 'ethereum-identity-kit'
import React from 'react'
import { Address } from 'viem'

interface Props {
  user: Address | string
}

const Profile: React.FC<Props> = ({ user }) => {

  return (
    <div>
      <FullWidthProfile addressOrName={user} />
    </div>
  )
}

export default Profile
