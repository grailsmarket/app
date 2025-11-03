'use client'

import React, { useState } from 'react'
import { FilterProvider } from '@/context/filters'
import { Address } from 'viem'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActionButtons from '@/app/portfolio/components/actionButtons'
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
    <FilterProvider filterType='profile' profileTab={profileTab}>
      <div className='md:p-lg z-50 mt-12 md:mt-0'>
        <div
          style={{ height: 'calc(100vh - 160px)' }}
          className='p-lg bg-background border-primary relative z-10 flex gap-4 overflow-hidden rounded-lg border-t-2 md:border-2'
        >
          <FilterPanel />
          <div
            className='md:pt-lg flex flex-col gap-4'
            style={{
              width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
            }}
          >
            <TabSwitcher profileTab={profileTab} setProfileTab={setProfileTab} />
            {profileTab === 'domains' && <DomainPanel user={user} />}
            {profileTab === 'activity' && <ActivityPanel user={user} userAddress={userAccount?.address} />}
          </div>
          <ActionButtons />
        </div>
      </div>
    </FilterProvider>
  )
}

export default MainPanel
