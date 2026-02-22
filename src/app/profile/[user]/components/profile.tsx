'use client'

import React, { useState } from 'react'
import { Address } from 'viem'
import {
  fetchProfileDetails,
  FollowersAndFollowing,
  FullWidthProfile,
  ProfileTabType,
  useIsClient,
} from 'ethereum-identity-kit'
import MainPanel from './main-panel'
import { useUserContext } from '@/context/user'
import { useQuery } from '@tanstack/react-query'
import { getPoap } from '@/api/user/getPoap'
import Details from './details'
import {
  setListSettingsModalList,
  setListSettingsModalOpen,
  setListSettingsModalUser,
} from '@/state/reducers/modals/listSettingsModal'
import { useAppDispatch } from '@/state/hooks'
import { fetchNameMetadata } from '@/api/name/metadata'
import {
  setEditRecordsModalMetadata,
  setEditRecordsModalName,
  setEditRecordsModalOpen,
} from '@/state/reducers/modals/editRecordsModal'

interface Props {
  user: Address | string
}

const Profile: React.FC<Props> = ({ user }) => {
  const [isFollowersAndFollowingOpen, setIsFollowersAndFollowingOpen] = useState(false)
  const [defaultTab, setDefaultTab] = useState<ProfileTabType>('following')

  const isClient = useIsClient()
  const dispatch = useAppDispatch()
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

  const { data: userProfile } = useQuery({
    queryKey: ['profile', user, undefined, false, undefined],
    queryFn: () => (user ? fetchProfileDetails(user) : null),
  })

  const isSubname = userProfile?.ens?.name ? userProfile?.ens?.name.split('.').length > 2 : false

  const { data: profileMetadata } = useQuery({
    queryKey: ['profileMetadata', userProfile],
    queryFn: async () => {
      if (!userProfile?.ens?.name) return null

      const result = await fetchNameMetadata(userProfile?.ens?.name)
      const metadata = Object.entries(result || {})
        .flatMap(([key, value]) => {
          if (key === 'chains') {
            return value.map(({ chainName, address }: { chainName: string; address: string }) => ({
              label: chainName,
              value: address,
              canCopy: true,
            }))
          }

          return {
            label: key,
            value: value,
            canCopy: true,
          }
        })
        .filter((row) => row.label !== 'resolverAddress')
        .reduce(
          (acc, row) => {
            acc[row.label] = row.value
            return acc
          },
          {} as Record<string, string>
        )

      return metadata
    },
    enabled: !!userProfile?.ens?.name,
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
        <div
          className='border-tertiary relative z-20 flex w-full flex-col border-b-2 lg:flex-row'
          suppressHydrationWarning={true}
        >
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
                  openListSettings: () => {
                    if (!userProfile || !userProfile?.primary_list) return
                    dispatch(setListSettingsModalOpen(true))
                    dispatch(setListSettingsModalUser(userProfile))
                    dispatch(setListSettingsModalList(parseInt(userProfile?.primary_list)))
                  },
                  onEditProfileClick:
                    userProfile?.ens?.name && !isSubname
                      ? () => {
                          if (!profileMetadata || !userProfile?.ens?.name) return
                          dispatch(setEditRecordsModalName(userProfile?.ens?.name))
                          dispatch(setEditRecordsModalMetadata(profileMetadata))
                          dispatch(setEditRecordsModalOpen(true))
                        }
                      : undefined,
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
