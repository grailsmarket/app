'use client'

import React, { Suspense, useEffect } from 'react'
import { FilterProvider } from '@/context/filters'
import { Address, isAddress } from 'viem'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import TabSwitcher from './tabSwitcher'
import { fetchAccount } from 'ethereum-identity-kit'
import { useIsClient } from 'ethereum-identity-kit'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'
import ActivityPanel from './activity'
import BrokerPanel from './brokerPanel'
import { useQuery } from '@tanstack/react-query'
import OfferPanel from './offerPanel'
import { changeTab, selectUserProfile, setLastVisitedProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import ActionButtons from './actionButtons'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { accountQueryKey } from '@/utils/queryKeys'

interface Props {
  user: string
  list?: number
  resolvedOwner?: Address
}

const MainPanel: React.FC<Props> = ({ user, list, resolvedOwner }) => {
  const { userAddress, authStatus } = useUserContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const profileTab = selectedTab.value
  const routeAddress = isAddress(user, { strict: false }) ? user : undefined
  const { data: fetchedUserAccount, isLoading } = useQuery({
    queryKey: list === undefined ? accountQueryKey(user) : ['listAccount', list],
    queryFn: async () => {
      const account = await fetchAccount(user, list)
      return account?.address ? account : null
    },
    enabled: !routeAddress && !resolvedOwner,
  })
  const owner = routeAddress ?? resolvedOwner ?? fetchedUserAccount?.address
  const address = owner && isAddress(owner, { strict: false }) ? (owner.toLowerCase() as Address) : undefined
  const isMyProfile = !!address && authStatus === 'authenticated' && address === userAddress?.toLowerCase()

  if (!address) {
    return (
      <p className='p-4' role='status'>
        {isLoading ? 'Loading profile…' : 'Could not resolve this profile’s address.'}
      </p>
    )
  }

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
      <FilterProvider key={address} filterType='profile' profileTab={selectedTab} profileAddress={address}>
        <div className='w-full'>
          <div className='z-10 w-full'>
            <div className='bg-background relative flex min-h-[calc(100dvh-56px)] w-full flex-col gap-0 md:min-h-[calc(100dvh-70px)]'>
              <TabSwitcher user={address} />
              <div className='relative flex w-full flex-row gap-0 transition-all duration-300'>
                <FilterPanel />
                <ProfileContent
                  userAddress={address}
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
  const { width: responsiveWidth } = useResponsiveSize()
  const { selectors, profileTab, actions } = useFilterRouter()
  const { lastVisitedProfile } = useAppSelector(selectUserProfile)
  const dispatch = useAppDispatch()
  const { authStatus } = useUserContext()
  const filtersOpen = selectors.filters.open

  // Scroll to top if this user profile isn't the one most recently visited
  // Makes sure that exploring a user's profile does not always reset scroll position
  // which is why we use the "lastViewedProfile", but when going to a new profile we
  // scroll to the top so the user can be sure they navigated to the correct profile
  useEffect(() => {
    if (!userAddress || lastVisitedProfile === userAddress) return
    if (lastVisitedProfile) {
      dispatch(actions?.setScrollTop?.(0))
      dispatch(clearBulkSelect())
    }

    document.scrollingElement?.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })

    dispatch(setLastVisitedProfile(userAddress))
  }, [userAddress, lastVisitedProfile])

  // ensure that only the owner of the profile can see the watchlist
  useEffect(() => {
    if (profileTab?.value !== 'watchlist') return

    // if the auth status is loading, wait for it to resolve
    if (authStatus === 'loading') return

    // if the user is not authenticated, switch to domains
    if (authStatus !== 'authenticated') {
      dispatch(changeTab(PROFILE_TABS[0]))
      return
    }

    // if the user is authenticated but account data not loaded yet, we can't determine if they are the owner
    if (!userAddress) return

    // if the user is not the profile owner, switch to domains
    if (!isMyProfile) {
      dispatch(changeTab(PROFILE_TABS[0]))
    }
  }, [profileTab, isMyProfile, authStatus, userAddress, dispatch])

  const getContentWidth = () => {
    if (!isClient || !responsiveWidth) return '100%'
    if (responsiveWidth < 1024) return '100%'
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
