'use client'

import { fetchDomains } from '@/api/domains/fetchDomains'
import Card from '@/components/domains/grid/components/card'
import LoadingCard from '@/components/domains/grid/components/loadingCard'
import { useUserContext } from '@/context/user'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import ArrowRight from 'public/icons/arrow-back.svg'

interface ExploreProps {
  setDropdownOption: (option: string | null) => void
}

const Explore: React.FC<ExploreProps> = ({ setDropdownOption }) => {
  const { authStatus } = useUserContext()
  const { data: listings, isLoading } = useQuery({
    queryKey: ['explore', 'listings'],
    queryFn: () =>
      fetchDomains({
        limit: 4,
        pageParam: 2,
        filters: {
          ...emptyFilterState,
          market: {
            ...emptyFilterState.market,
            Listed: 'yes',
          },
          type: {
            Digits: 'exclude',
            Emojis: 'exclude',
            Repeating: 'include',
            Letters: 'include',
          },
        },
        searchTerm: '',
        isAuthenticated: authStatus === 'authenticated',
        inAnyCategory: true,
        excludeCategories: ['prepunks'],
      }),
  })

  return (
    <div className='flex flex-row gap-8 justify-center'>
      <div className='flex flex-col text-2xl pt-xl justify-between font-semibold gap-4 h-[400px] text-neutral w-56'>
        <div className='flex flex-col gap-4 h-full w-fit'>
          <div className='w-fit fadeIn' style={{ animationDelay: '0.2s' }}><Link href='/marketplace?tab=listings' className='hover:text-primary hover-underline transition-all duration-200'>Listings</Link></div>
          <div className='w-fit fadeIn' style={{ animationDelay: '0.35s' }}><Link href='/marketplace?tab=premium' className='hover:text-primary hover-underline transition-all duration-200'>Premium Names</Link></div>
          <div className='w-fit fadeIn' style={{ animationDelay: '0.5s' }}><Link href='/marketplace?tab=available' className='hover:text-primary hover-underline transition-all duration-200'>Available Names</Link></div>
          <div className='w-fit fadeIn' style={{ animationDelay: '0.65s' }}><Link href='/marketplace?tab=activity' className='hover:text-primary hover-underline transition-all duration-200'>Activity</Link></div>
        </div>
        <div className='py-md border-t border-neutral w-full slideInLeft' style={{ animationDelay: '0.7s' }}>
          <Link href='/marketplace' onClick={() => setDropdownOption(null)} className='hover:text-primary flex group items-center gap-2'>
            <p className='group-hover:text-primary hover-underline transition-colors duration-300'>View All Names</p>
            <Image
              src={ArrowRight}
              alt='Arrow Right'
              width={20}
              height={20}
              className='group-hover:rotate-90 transition-transform duration-300 ease-out opacity-50 group-hover:opacity-100'
            />
          </Link></div>
      </div>
      <div className='grid grid-cols-4 gap-4 w-fit overflow-scroll'>
        {isLoading ? Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className='h-[400px] w-[220px] fadeIn' style={{ animationDelay: `${0.2 + index * 0.15}s` }}><LoadingCard /></div>
        )) : listings?.domains.map((domain, index) => (
          <div key={domain.name} className='bg-secondary h-[400px] w-[220px] fadeIn' style={{ animationDelay: `${0.2 + index * 0.15}s` }}><Card domain={domain} /></div>
        ))}
      </div>
    </div>
  )
}

export default Explore
