'use client'

import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useQuery } from '@tanstack/react-query'
import React from 'react'
import Card from '../domains/grid/components/card'
import LoadingCard from '../domains/grid/components/loadingCard'
import { useUserContext } from '@/context/user'

const DisplayedCards: React.FC = () => {
  const { authStatus } = useUserContext()
  const { data: domains, isLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const domains = await fetchDomains({
        limit: 3,
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
  return (
    <div className='shadow-primary background-radial-primary relative mt-28 h-[280px] w-[240px] rounded-full sm:mt-24 lg:mt-40'>
      <div className='shadow-homeCard absolute -top-28 left-0 z-20 h-[360px] w-[190px] rounded-lg sm:-top-24 sm:left-0 sm:h-[410px] sm:w-[240px]'>
        {isLoading || !domains ? (
          <LoadingCard />
        ) : (
          domains[0] && (
            <Card domain={domains[0]} className='bg-secondary! hover:bg-tertiary! opacity-100! hover:opacity-100!' />
          )
        )}
      </div>
      <div className='shadow-homeCard absolute top-0 left-28 z-30 h-[360px] w-[190px] rounded-lg sm:top-0 sm:left-36 sm:h-[410px] sm:w-[240px]'>
        {isLoading || !domains ? (
          <LoadingCard />
        ) : (
          domains[1] && (
            <Card domain={domains[1]} className='bg-secondary! hover:bg-tertiary! opacity-100! hover:opacity-100!' />
          )
        )}
      </div>
      <div className='shadow-homeCard absolute top-14 -left-12 z-10 h-[360px] w-[190px] rounded-lg sm:top-24 sm:-left-20 sm:h-[410px] sm:w-[240px]'>
        {isLoading || !domains ? (
          <LoadingCard />
        ) : (
          domains[2] && (
            <Card domain={domains[2]} className='bg-secondary! hover:bg-tertiary! opacity-100! hover:opacity-100!' />
          )
        )}
      </div>
    </div>
  )
}

export default DisplayedCards
