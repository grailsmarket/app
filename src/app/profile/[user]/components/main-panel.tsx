'use client'

import React, { Suspense, useEffect, useMemo } from 'react'
import { FilterProvider } from '@/context/filters'
import { Address } from 'viem'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import TabSwitcher from './tabSwitcher'
import { fetchAccount } from 'ethereum-identity-kit'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import ActivityPanel from './activity'
import { useQuery } from '@tanstack/react-query'
import OfferPanel from './offerPanel'
import { changeTab, selectUserProfile, setLastVisitedProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import ActionButtons from './actionButtons'
import {
  clearActivityFilters,
  setFiltersScrollTop as setActivityScrollTop,
} from '@/state/reducers/filters/profileActivityFilters'
import { clearReceivedOffersFilters, setReceivedOffersScrollTop } from '@/state/reducers/filters/receivedOffersFilters'
import { clearMyOffersFilters, setMyOffersScrollTop } from '@/state/reducers/filters/myOffersFilters'
import { clearWatchlistFilters, setWatchlistFiltersScrollTop } from '@/state/reducers/filters/watchlistFilters'
import {
  clearFilters,
  setFiltersScrollTop as setDomainsScrollTop,
} from '@/state/reducers/filters/profileListingsFilter'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import BulkSelect from '@/components/ui/bulkSelect'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

interface Props {
  user: Address | string
}

const MainPanel: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const { selectedTab, lastVisitedProfile } = useAppSelector(selectUserProfile)
  const profileTab = selectedTab.value
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
      // Reset all scroll positions
      dispatch(setDomainsScrollTop(0))
      dispatch(setActivityScrollTop(0))
      dispatch(setMyOffersScrollTop(0))
      dispatch(setReceivedOffersScrollTop(0))
      dispatch(setWatchlistFiltersScrollTop(0))
      dispatch(clearBulkSelect())
      document.scrollingElement?.scrollTo({ top: 0, behavior: 'instant' })
      window.scrollTo({ top: 0, behavior: 'instant' })
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
            <div className='bg-background border-tertiary relative flex min-h-[calc(100dvh-56px)] w-full flex-col gap-0 border-t-2 md:min-h-[calc(100dvh-70px)]'>
              <TabSwitcher user={userAccount?.address} />
              <div className='relative flex w-full flex-row gap-0 transition-all duration-300'>
                <FilterPanel hasTabs={true} />
                <ProfileContent
                  userAddress={userAccount?.address}
                  showDomainsPanel={showDomainsPanel}
                  showOfferPanel={showOfferPanel}
                  showActivityPanel={showActivityPanel}
                />
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

// Inner component to access filter state from context
interface ProfileContentProps {
  userAddress: Address | undefined
  showDomainsPanel: boolean
  showOfferPanel: boolean
  showActivityPanel: boolean
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userAddress,
  showDomainsPanel,
  showOfferPanel,
  showActivityPanel,
}) => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-2 pt-2 transition-all duration-300' style={{ width: getContentWidth() }}>
      {showDomainsPanel && <DomainPanel user={userAddress} />}
      {showOfferPanel && <OfferPanel user={userAddress} />}
      {showActivityPanel && <ActivityPanel user={userAddress} />}
    </div>
  )
}

export default MainPanel
