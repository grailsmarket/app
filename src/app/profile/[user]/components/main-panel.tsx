'use client'

import React, { Suspense, useEffect, useMemo } from 'react'
import { FilterProvider } from '@/context/filters'
import { Address, isAddress } from 'viem'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import TabSwitcher from './tabSwitcher'
import { fetchAccount } from 'ethereum-identity-kit'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import ActivityPanel from './activity'
import BrokerPanel from './brokerPanel'
import { useQuery } from '@tanstack/react-query'
import OfferPanel from './offerPanel'
import { changeTab, selectUserProfile, setLastVisitedProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import ActionButtons from './actionButtons'
import {
  clearFilters,
  setFiltersScrollTop as setActivityScrollTop,
} from '@/state/reducers/filters/profileActivityFilters'
import {
  clearFilters as clearReceivedOffersFilters,
  setScrollTop as setReceivedOffersScrollTop,
} from '@/state/reducers/filters/receivedOffersFilters'
import {
  clearFilters as clearMyOffersFilters,
  setScrollTop as setMyOffersScrollTop,
} from '@/state/reducers/filters/myOffersFilters'
import {
  clearFilters as clearWatchlistFilters,
  setScrollTop as setWatchlistFiltersScrollTop,
} from '@/state/reducers/filters/watchlistFilters'
import {
  clearFilters as clearListingsFilters,
  setScrollTop as setListingsScrollTop,
} from '@/state/reducers/filters/profileListingsFilter'
import {
  clearFilters as clearGraceFilters,
  setScrollTop as setGraceScrollTop,
} from '@/state/reducers/filters/profileGraceFilters'
import {
  clearFilters as clearExpiredFilters,
  setScrollTop as setExpiredScrollTop,
} from '@/state/reducers/filters/profileExpiredFilters'
import {
  clearFilters as clearDomainsFilters,
  setScrollTop as setDomainsScrollTop,
} from '@/state/reducers/filters/profileDomainsFilters'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { accountQueryKey } from '@/utils/queryKeys'

interface Props {
  user: Address | string
}

const MainPanel: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const { selectedTab, lastVisitedProfile } = useAppSelector(selectUserProfile)
  const profileTab = selectedTab.value
  const { data: fetchedUserAccount } = useQuery({
    queryKey: accountQueryKey(user),
    queryFn: async () => {
      const account = await fetchAccount(user)
      return account?.address ? account : null
    },
    enabled: !!user,
  })
  const userAccount =
    fetchedUserAccount ||
    (isAddress(user)
      ? {
          address: user,
          ens: null,
          primary_list: null,
        }
      : null)

  const isMyProfile = useMemo(
    () =>
      (userAccount?.address || user)?.toLowerCase() === userAddress?.toLowerCase() && authStatus === 'authenticated',
    [user, userAddress, authStatus, userAccount?.address]
  )

  useEffect(() => {
    // reset filters when visiting a new profile
    if (lastVisitedProfile && lastVisitedProfile !== user) {
      if (profileTab !== 'watchlist') {
        dispatch(changeTab(PROFILE_TABS[0]))
      }

      dispatch(clearDomainsFilters())
      dispatch(clearListingsFilters())
      dispatch(clearMyOffersFilters())
      dispatch(clearReceivedOffersFilters())
      dispatch(clearWatchlistFilters())
      dispatch(clearFilters())
      dispatch(clearGraceFilters())
      dispatch(clearExpiredFilters())
      // Reset all scroll positions
      dispatch(setDomainsScrollTop(0))
      dispatch(setListingsScrollTop(0))
      dispatch(setActivityScrollTop(0))
      dispatch(setMyOffersScrollTop(0))
      dispatch(setReceivedOffersScrollTop(0))
      dispatch(setWatchlistFiltersScrollTop(0))
      dispatch(setGraceScrollTop(0))
      dispatch(setExpiredScrollTop(0))
      dispatch(clearBulkSelect())
      document.scrollingElement?.scrollTo({ top: 0, behavior: 'instant' })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }

    dispatch(setLastVisitedProfile(user))
  }, [user])

  // ensure that only the owner of the profile can see the watchlist
  useEffect(() => {
    if (profileTab !== 'watchlist') return

    // if the auth status is loading, wait for it to resolve
    if (authStatus === 'loading') return

    // if the user is not authenticated, switch to domains
    if (authStatus !== 'authenticated') {
      dispatch(changeTab(PROFILE_TABS[0]))
      return
    }

    // if the user is authenticated but account data not loaded yet, we can't determine if they are the owner
    if (!userAccount?.address) return

    // if the user is not the profile owner, switch to domains
    if (!isMyProfile) {
      dispatch(changeTab(PROFILE_TABS[0]))
    }
  }, [profileTab, isMyProfile, authStatus, userAccount?.address, dispatch])

  const showDomainsPanel =
    profileTab === 'domains' ||
    profileTab === 'watchlist' ||
    profileTab === 'listings' ||
    profileTab === 'grace' ||
    profileTab === 'expired'
  const showOfferPanel = profileTab === 'sent_offers' || profileTab === 'received_offers'
  const showActivityPanel = profileTab === 'activity'
  const showBrokerPanel = profileTab === 'broker'

  return (
    <Suspense>
      <FilterProvider filterType='profile' profileTab={selectedTab} profileAddress={userAccount?.address || user}>
        <div className='w-full'>
          <div className='z-10 w-full'>
            <div className='bg-background relative flex min-h-[calc(100dvh-56px)] w-full flex-col gap-0 md:min-h-[calc(100dvh-70px)]'>
              <TabSwitcher user={userAccount?.address} />
              <div className='relative flex w-full flex-row gap-0 transition-all duration-300'>
                <FilterPanel />
                <ProfileContent
                  userAddress={userAccount?.address}
                  showDomainsPanel={showDomainsPanel}
                  showOfferPanel={showOfferPanel}
                  showActivityPanel={showActivityPanel}
                  showBrokerPanel={showBrokerPanel}
                  isMyProfile={isMyProfile}
                />
              </div>
              <ActionButtons />
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
  showBrokerPanel: boolean
  isMyProfile: boolean
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  userAddress,
  showDomainsPanel,
  showOfferPanel,
  showActivityPanel,
  showBrokerPanel,
  isMyProfile,
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
    <div className='z-0 flex w-full flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
      {showDomainsPanel && <DomainPanel user={userAddress} isMyProfile={isMyProfile} />}
      {showOfferPanel && <OfferPanel user={userAddress} />}
      {showActivityPanel && <ActivityPanel user={userAddress} />}
      {showBrokerPanel && <BrokerPanel user={userAddress} />}
    </div>
  )
}

export default MainPanel
