'use client'

import { Suspense, useEffect, useState } from 'react'
import FilterPanel from '@/components/filters'
import DomainPanel from './components/domainPanel'
import ActionButtons from './components/actionButtons'
import { FilterProvider } from '@/context/filters'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import OfferPanel from './components/offerPanel'
import { useDomains } from './hooks/useDomains'

const Portfolio = () => {
  const { selectedTab } = useAppSelector(selectUserProfile)
  const [mounted, setMounted] = useState(false)
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, displayedDetails } = useDomains()

  useEffect(() => {
    setMounted(true)
  }, [])

  const showDomainPanel = selectedTab.value === 'domains' || selectedTab.value === 'watchlist'
  const showOfferPanel = selectedTab.value === 'received_offers' || selectedTab.value === 'sent_offers'

  return (
    <Suspense>
      <FilterProvider filterType='portfolio' portfolioTab={selectedTab.value}>
        <main className='relative max-h-[100dvh]! overflow-hidden'>
          <div className='relative z-10 mx-auto flex w-full flex-col gap-32'>
            <div className='bg-background relative mx-auto flex h-[calc(100dvh-56px)] w-full flex-row overflow-hidden md:h-[calc(100dvh-72px)] lg:pl-2'>
              <FilterPanel />
              <div className='bg-tertiary ml-1.5 hidden h-full w-0.5 lg:block' />
              {mounted ? (
                <>
                  {showDomainPanel && (
                    <DomainPanel
                      domains={domains}
                      domainsLoading={domainsLoading}
                      fetchMoreDomains={fetchMoreDomains}
                      hasMoreDomains={hasMoreDomains}
                      displayedDetails={displayedDetails}
                    />
                  )}
                  {showOfferPanel && <OfferPanel />}
                </>
              ) : (
                /* Render default panel during SSR to avoid hydration mismatch */
                <DomainPanel
                  domains={domains}
                  domainsLoading={domainsLoading}
                  fetchMoreDomains={fetchMoreDomains}
                  hasMoreDomains={hasMoreDomains}
                  displayedDetails={displayedDetails}
                />
              )}
              <ActionButtons />
            </div>
          </div>
        </main>
      </FilterProvider>
    </Suspense>
  )
}

export default Portfolio
