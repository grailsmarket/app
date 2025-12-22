'use client'

import React, { Suspense, useEffect, useMemo } from 'react'
import { FilterProvider } from '@/context/filters'
import { Address } from 'viem'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import TabSwitcher from './tabSwitcher'
import { fetchAccount, useIsClient, useWindowSize } from 'ethereum-identity-kit'
import ActivityPanel from './activity'
import { useQuery } from '@tanstack/react-query'
import OfferPanel from './offerPanel'
import { changeTab, selectUserProfile, setLastVisitedProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import ActionButtons from './actionButtons'
import { clearActivityFilters, setFiltersScrollTop } from '@/state/reducers/filters/profileActivityFilters'
import { clearReceivedOffersFilters } from '@/state/reducers/filters/receivedOffersFilters'
import { clearMyOffersFilters } from '@/state/reducers/filters/myOffersFilters'
import { clearWatchlistFilters } from '@/state/reducers/filters/watchlistFilters'
import {
  clearFilters,
  setFiltersScrollTop as setDomainsScrollTop,
} from '@/state/reducers/filters/profileListingsFilter'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import BulkSelect from '@/components/ui/bulkSelect'

interface Props {
  user: Address | string
}

const MainPanel: React.FC<Props> = ({ user }) => {
  const isClient = useIsClient()
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const { selectedTab, lastVisitedProfile } = useAppSelector(selectUserProfile)
  const profileTab = selectedTab.value
  const { width: windowWidth } = useWindowSize()
  const { data: userAccount } = useQuery({
    queryKey: ['account', user],
    queryFn: () => fetchAccount(user),
    enabled: !!user,
  })

  const isMyProfile = useMemo(
    () =>
      (userAccount?.address || user)?.toLowerCase() === userAddress?.toLowerCase() && authStatus === 'authenticated',
    [user, userAddress, authStatus, userAccount?.address]
  )

  useEffect(() => {
    // reset filters when visiting a new profile
    if (lastVisitedProfile && lastVisitedProfile !== user) {
      dispatch(setLastVisitedProfile(user))
      dispatch(clearFilters())
      dispatch(clearMyOffersFilters())
      dispatch(clearReceivedOffersFilters())
      dispatch(clearWatchlistFilters())
      dispatch(clearActivityFilters())
      dispatch(setFiltersScrollTop(0))
      dispatch(setDomainsScrollTop(0))
      dispatch(clearBulkSelect())
      document.scrollingElement?.scrollTo({ top: 0, behavior: 'instant' })
    }

    dispatch(setLastVisitedProfile(user))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ensure that only the owner of the profile can see the watchlist
  useEffect(() => {
    if (profileTab === 'watchlist') {
      if (
        !(
          userAddress &&
          (userAccount?.address || user).toLowerCase() === userAddress?.toLowerCase() &&
          authStatus === 'authenticated'
        )
      ) {
        dispatch(changeTab(PROFILE_TABS[0]))
      }
    }
  }, [profileTab, userAccount?.address, userAddress, authStatus, dispatch, user])

  const showDomainsPanel = profileTab === 'domains' || profileTab === 'watchlist' || profileTab === 'listings'
  const showOfferPanel = profileTab === 'sent_offers' || profileTab === 'received_offers'
  const showActivityPanel = profileTab === 'activity'

  return (
    <Suspense>
      <FilterProvider filterType='profile' profileTab={selectedTab}>
        <div className='w-full'>
          <div className='z-10 w-full'>
            <div className='lg:pl-md bg-background border-tertiary relative flex h-[100dvh] w-full gap-0 overflow-hidden border-t-2 md:h-[calc(100dvh-70px)]'>
              <FilterPanel />
              <div className='bg-tertiary ml-2 hidden h-full w-[3px] lg:block' />
              <div
                className='flex w-full flex-col gap-2'
                style={{
                  width: isClient && windowWidth && windowWidth > 1024 ? 'calc(100% - 280px)' : '100%',
                }}
              >
                <TabSwitcher user={userAccount?.address} />
                {showDomainsPanel && <DomainPanel user={userAccount?.address} />}
                {showOfferPanel && <OfferPanel user={userAccount?.address} />}
                {showActivityPanel && <ActivityPanel user={userAccount?.address} />}
              </div>
              <ActionButtons />
              <BulkSelect isMyProfile={isMyProfile} />
            </div>
          </div>
        </div>
      </FilterProvider>
    </Suspense>
  )
}

export default MainPanel
