'use client'

import React, { Suspense, useState } from 'react'
import { FilterProvider } from '@/context/filters'
import { Address } from 'viem'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { ProfileTabType } from '@/types/filters'
import TabSwitcher from './tabSwitcher'
import { fetchAccount, useWindowSize } from 'ethereum-identity-kit'
import ActivityPanel from './activity'
import { useQuery } from '@tanstack/react-query'

interface Props {
  user: Address | string
}

const MainPanel: React.FC<Props> = ({ user }) => {
  const [profileTab, setProfileTab] = useState<ProfileTabType>('domains')
  const { width: windowWidth } = useWindowSize()
  const { data: userAccount } = useQuery({
    queryKey: ['account', user],
    queryFn: () => fetchAccount(user),
    enabled: !!user,
  })

  return (
    <Suspense>
      <FilterProvider filterType='profile' profileTab={profileTab}>
        <div className='max-w-domain-panel z-0 mx-auto'>
          <div className='z-10'>
            <div
              className='pl-md bg-background border-tertiary relative flex gap-0 overflow-hidden h-[calc(100vh-80px)] border-t-2'
            >
              <FilterPanel />
              <div className='w-0.5 h-full bg-tertiary hidden lg:block ml-2' />

              <div
                className='flex flex-col gap-2'
                style={{
                  width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
                }}
              >
                <TabSwitcher profileTab={profileTab} setProfileTab={setProfileTab} />
                {profileTab === 'domains' && <DomainPanel user={user} />}
                {profileTab === 'activity' && <ActivityPanel user={user} userAddress={userAccount?.address} />}
              </div>
              <ActionButtons hideDomainActions={profileTab === 'activity'} />
            </div>
          </div>
        </div>
      </FilterProvider>
    </Suspense>
  )
}

export default MainPanel
