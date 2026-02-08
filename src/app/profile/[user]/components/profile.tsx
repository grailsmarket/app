'use client'

import React, { useState } from 'react'
import { Address } from 'viem'
import { FollowersAndFollowing, FullWidthProfile, ProfileTabType, useIsClient } from 'ethereum-identity-kit'
import MainPanel from './main-panel'
import { useUserContext } from '@/context/user'
import { useQuery } from '@tanstack/react-query'
import { getPoap } from '@/api/user/getPoap'
import Details from './details'

interface Props {
  user: Address | string
}

const Profile: React.FC<Props> = ({ user }) => {
  const [isFollowersAndFollowingOpen, setIsFollowersAndFollowingOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<ProfileTabType>('following')

  const isClient = useIsClient()
  const { userAddress } = useUserContext()
  const { data: userPoap } = useQuery({
    queryKey: ['userPoap', user],
    queryFn: async () => {
      if (!user) return null

      const result = await getPoap(user)

      if (result?.badges.length === 0) return null

      return result
    },
    enabled: !!user,
  })

  return (
    <div>
      {isFollowersAndFollowingOpen && (
        <div
          onClick={() => setIsFollowersAndFollowingOpen(false)}
          className='fixed top-0 left-0 z-50 flex h-[100dvh] w-full items-end justify-center overflow-y-auto bg-black/50 backdrop-blur-sm md:items-start'
        >
          <div className='max-h-[90vh] w-full max-w-2xl overflow-y-auto md:max-h-none md:overflow-y-visible md:py-12'>
            <FollowersAndFollowing connectedAddress={userAddress} user={user} defaultTab={defaultTab} />
          </div>
        </div>
      )}
      <div className='dark relative z-0 w-full'>
        <div className='z-20 flex w-full flex-col lg:flex-row' suppressHydrationWarning={true}>
          {/* Issues inside of EIK, so having to render on the client */}
          {isClient && (
            <>
              <FullWidthProfile
                connectedAddress={userAddress}
                addressOrName={user}
                showPoaps={true}
                showFollowButton={true}
                showFollowerState={true}
                style={{ paddingLeft: '10px' }}
                onStatClick={({ stat }) => {
                  setIsFollowersAndFollowingOpen(true)
                  setDefaultTab(stat)
                }}
                extraOptions={{
                  // customPoaps: isPoapClaimed ? [GRAILS_POAP] : undefined,
                  hideSocials: ['grails'],
                  customPoaps: userPoap?.badges
                    ? userPoap.badges.map((badge) => ({
                        eventId: badge.event.id.toString(),
                        participated: true,
                        collection: badge,
                      }))
                    : undefined,
                }}
                // style={{ paddingBottom: '60px', transform: 'translateY(80px)' }}
              />
              <Details user={user} />
            </>
          )}
        </div>
        <div className='w-full'>
          <MainPanel user={user} />
        </div>
      </div>
    </div>
  )
}

export default Profile
