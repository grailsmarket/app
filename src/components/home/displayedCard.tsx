'use client'

import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useQuery } from '@tanstack/react-query'
import React, { useMemo } from 'react'
import Card from '../domains/grid/components/card'
import LoadingCard from '../domains/grid/components/loadingCard'
import { useUserContext } from '@/context/user'
import { cn } from '@/utils/tailwind'
import { useWindowSize } from 'ethereum-identity-kit'

const DisplayedCards: React.FC = () => {
  const { authStatus } = useUserContext()
  const { width } = useWindowSize()
  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const domains = await fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          market: {
            Listed: 'yes',
            'Has Offers': 'none',
            'Has Last Sale': 'none',
            marketplace: 'grails',
          },
          categories: ['any'],
        },
        // inAnyCategory: true,
        searchTerm: '',
        excludeCategories: ['prepunks'],
        isAuthenticated: authStatus === 'authenticated',
      })

      return domains.domains
    },
  })

  const cardCount = useMemo(() => {
    if (width && width < 640) return 5
    if (width && width < 780) return 3
    if (width && width < 968) return 4
    if (width && width < 1100) return 5
    if (width && width < 1280) return 6
    return 7
  }, [width])

  const containerWidth = useMemo(() => {
    if (width && width < 640) return 'w-[670px]'
    if (width && width < 780) return 'w-[580px]'
    if (width && width < 968) return 'w-[750px]'
    if (width && width < 1100) return 'w-[920px]'
    if (width && width < 1280) return 'w-[1090px]'
    return 'w-[1260px]'
  }, [width])

  return (
    <div
      className={cn(
        'shadow-primary background-radial-primary relative mt-56 mb-36 h-[60px] rounded-full sm:mt-44',
        containerWidth
      )}
    >
      {isLoading &&
        Array.from({ length: cardCount }).map((_, index) => (
          <div key={index}>
            <LoadingCard key={index} />
          </div>
        ))}
      {!isLoading && domains ? (
        domains.slice(0, cardCount).map((domain, index) => {
          const leftMobile = index * 120
          const leftDesktop = index * 170

          return (
            <div
              key={index}
              className={cn(
                'shadow-homeCard absolute -top-40 left-0 z-20 h-[360px] w-[190px] rounded-xl sm:h-[410px] sm:w-[240px]',
                index % 2 === 0 ? 'sm:-top-40' : '-top-56'
              )}
              style={{
                left: width && width < 640 ? leftMobile : leftDesktop,
                zIndex: index,
              }}
            >
              <Card
                domain={domain}
                className='bg-secondary! hover:bg-tertiary! rounded-xl! opacity-100! hover:opacity-100!'
              />
            </div>
          )
        })
      ) : (
        <div>No domains found</div>
      )}

      {/* <div className='shadow-homeCard absolute top-0 left-28 z-30 h-[360px] w-[190px] rounded-lg sm:h-[410px] sm:w-[240px]'>
        {isLoading || !domains ? (
          <LoadingCard />
        ) : (
          domains[1] && (
            <Card domain={domains[1]} className='bg-secondary! hover:bg-tertiary! opacity-100! hover:opacity-100!' />
          )
        )}
      </div>
      <div className='shadow-homeCard absolute top-8 left-56 z-10 h-[360px] w-[190px] rounded-lg sm:h-[410px] sm:w-[240px]'>
        {isLoading || !domains ? (
          <LoadingCard />
        ) : (
          domains[2] && (
            <Card domain={domains[2]} className='bg-secondary! hover:bg-tertiary! opacity-100! hover:opacity-100!' />
          )
        )}
      </div> */}
    </div>
  )
}

export default DisplayedCards
