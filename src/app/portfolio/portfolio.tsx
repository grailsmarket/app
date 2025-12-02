'use client'

import { Suspense, useEffect, useState } from 'react'
import FilterPanel from '@/components/filters'
// import heroBackground from 'public/art/wallpapper-left.svg'
// import heroBackgroundRight from 'public/art/wallpapper-right.svg'
import DomainPanel from './components/domainPanel'
import ActionButtons from './components/actionButtons'
import { FilterProvider } from '@/context/filters'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import OfferPanel from './components/offerPanel'

const Portfolio = () => {
  const { selectedTab } = useAppSelector(selectUserProfile)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showDomainPanel = selectedTab.value === 'domains' || selectedTab.value === 'watchlist'
  const showOfferPanel = selectedTab.value === 'received_offers' || selectedTab.value === 'my_offers'

  return (
    <Suspense>
      <FilterProvider filterType='portfolio' portfolioTab={selectedTab.value}>
        <main className='relative max-h-[100dvh]! overflow-hidden'>
          {/* <div className='absolute top-0 left-0 z-0 flex h-full w-screen -translate-y-56 items-center justify-between'>
          <Image
            src={heroBackground}
            alt='hero-background'
            className='-translate-x-12 object-cover'
            width={400}
            height={900}
          />
          <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
        </div> */}
          <div className='relative z-10 mx-auto flex w-full flex-col gap-32 pt-14 md:pt-18'>
            <div className='bg-background relative mx-auto flex h-[calc(100dvh-56px)] w-full flex-row overflow-hidden md:h-[calc(100dvh-72px)] lg:pl-2'>
              <FilterPanel />
              <div className='bg-tertiary ml-1.5 hidden h-full w-0.5 lg:block' />
              {mounted ? (
                <>
                  {showDomainPanel && <DomainPanel />}
                  {showOfferPanel && <OfferPanel />}
                </>
              ) : (
                /* Render default panel during SSR to avoid hydration mismatch */
                <DomainPanel />
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
