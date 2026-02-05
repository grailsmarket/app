'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { MarketplaceDomainType } from '@/types/domains'
import Link from 'next/link'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { ShortArrow } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import LoadingCell from '@/components/ui/loadingCell'

interface NameDetailsProps {
  nameDetails?: MarketplaceDomainType | null
  nameDetailsIsLoading: boolean
}

const Categories: React.FC<NameDetailsProps> = ({ nameDetails, nameDetailsIsLoading }) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(true)
  const { categories } = useCategories()

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div
        className='flex cursor-pointer flex-row items-center justify-between transition-opacity hover:opacity-80'
        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
      >
        <h3 className='font-sedan-sc text-3xl'>Categories</h3>
        <div className='flex flex-row items-center gap-2'>
          {nameDetailsIsLoading ? (
            <LoadingCell height='20px' width='16px' />
          ) : (
            <p className='text-xl font-bold'>{nameDetails?.clubs?.length || 0}</p>
          )}
          <ShortArrow
            className={cn('h-4 w-4 flex-shrink-0 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')}
          />
        </div>
      </div>
      {isCategoryOpen &&
        (nameDetailsIsLoading ? (
          Array.from({ length: 2 }).map((_, index) => <LoadingCell key={index} height='60px' width='100%' />)
        ) : nameDetails?.clubs && nameDetails?.clubs.length > 0 ? (
          nameDetails?.clubs?.map((club) => {
            const category = categories?.find((c) => c.name === club)
            const categoryDetails = getCategoryDetails(club)

            return (
              <Link
                key={club}
                href={`/categories/${club}`}
                className='px-md bg-tertiary py-md hover:bg-foreground/20 relative flex min-w-fit gap-1 overflow-hidden rounded-lg font-medium transition-colors'
              >
                <Image
                  src={categoryDetails.header}
                  alt={club}
                  width={1000}
                  height={1000}
                  className='absolute top-0 left-0 h-full w-full object-cover opacity-20'
                />
                <div className='relative z-10 flex flex-row items-center gap-2'>
                  <Image
                    src={categoryDetails.avatar}
                    alt={club}
                    width={40}
                    height={40}
                    className='aspect-square! rounded-full'
                  />
                  <div>
                    <p className='text-xl font-semibold text-nowrap'>{categoryDetails.name}</p>
                    {category && (
                      <p className='text-neutral max-w-[calc(100%-20px)] truncate text-lg font-medium text-nowrap'>
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <p className='text-neutral pb-2 text-center text-lg font-medium'>No categories</p>
        ))}
    </div>
  )
}

export default Categories
