'use client'

import { useQuery } from '@tanstack/react-query'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import ArrowRight from 'public/icons/arrow-back.svg'
import Arrowdown from 'public/icons/arrow-down.svg'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { fetchFilteredCategories } from '@/api/categories/fetchFilteredCategories'
import CategoryRow from '@/app/categories/components/categoryRow'
import LoadingCell from '@/components/ui/loadingCell'
import { useAppDispatch } from '@/state/hooks'
import { changeCategoriesPageTab } from '@/state/reducers/categoriesPage/categoriesPage'
import { CATEGORIES_PAGE_TABS } from '@/constants/categories/categoriesPageTabs'

interface CategoriesProps {
  setDropdownOption: (option: string | null) => void
  previousDropdownOption: string | null
}

const Categories: React.FC<CategoriesProps> = ({ setDropdownOption, previousDropdownOption }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()
  // const { data: listings, isLoading } = useQuery({
  //   queryKey: ['explore', 'listings'],
  //   queryFn: () =>
  //     fetchDomains({
  //       limit: 4,
  //       pageParam: 2,
  //       filters: {
  //         ...emptyFilterState,
  //         market: {
  //           ...emptyFilterState.market,
  //           Listed: 'yes',
  //         },
  //         type: {
  //           Digits: 'exclude',
  //           Emojis: 'exclude',
  //           Repeating: 'include',
  //           Letters: 'include',
  //         },
  //       },
  //       searchTerm: '',
  //       isAuthenticated: authStatus === 'authenticated',
  //       inAnyCategory: true,
  //       excludeCategories: ['prepunks'],
  //     }),
  // })

  const { data: categories, isLoading } = useQuery({
    queryKey: ['navigation', 'categories'],
    queryFn: async () => {
      const results = await fetchFilteredCategories({
        sort: 'sales_volume_wei_1w',
        sortDirection: 'desc',
      })
      return results
    },
  })

  const cardCount = useMemo(() => {
    if (width && width < 640) return 0
    if (width && width < 780) return 0
    if (width && width < 968) return 1
    if (width && width < 1400) return 2
    if (width && width < 1850) return 3
    return 4
  }, [width])

  const defaultAnimationdelay = previousDropdownOption === null ? 0.2 : 0
  const clickHandler = () => {
    setDropdownOption(null)
    setIsDropdownOpen(false)
  }

  useEffect(() => {
    if (previousDropdownOption === null) {
      setIsDropdownOpen(false)
    }
  }, [previousDropdownOption])

  return (
    <div
      className='mx-auto flex w-full flex-col gap-4 overflow-hidden transition-all duration-300 md:flex-row md:justify-center xl:gap-8'
      style={{ height: width && width < 768 ? (isDropdownOpen ? '348px' : '40px') : 'auto' }}
    >
      <div
        className='md:hidde px-md flex cursor-pointer flex-row items-center justify-between md:hidden'
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <h3 className='text-3xl font-semibold'>Categories</h3>
        <Image
          src={Arrowdown}
          alt='Arrow Down'
          width={20}
          height={20}
          className={cn('transition-transform duration-300', isDropdownOpen ? 'rotate-180' : '')}
        />
      </div>
      <div className='pl-lg md:pt-lg text-neutral flex h-fit w-56 flex-col gap-4 text-2xl font-semibold md:h-[400px] md:justify-between md:pl-0'>
        <div className='flex h-full w-fit flex-col gap-4'>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/cazegories?tab=names'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[0]))
                clickHandler()
              }}
            >
              Category names
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.15}s` }}>
            <Link
              href='/categories?tab=listings'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[2]))
                clickHandler()
              }}
            >
              Listed names
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.3}s` }}>
            <Link
              href='/categories?tab=premium'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[3]))
                clickHandler()
              }}
            >
              Premium Names
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.45}s` }}>
            <Link
              href='/categories?tab=available'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[4]))
                clickHandler()
              }}
            >
              Available Names
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.6}s` }}>
            <Link
              href='/categories?tab=holders'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[5]))
                clickHandler()
              }}
            >
              Holders
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay + 0.75}s` }}>
            <Link
              href='/categories?tab=activity'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[6]))
                clickHandler()
              }}
            >
              Activity
            </Link>
          </div>
        </div>
        <div
          className='md:py-md border-neutral slideInLeft w-full md:border-t'
          style={{ animationDelay: `${defaultAnimationdelay + 0.9}s` }}
        >
          <Link
            href='/categories?tab=categories'
            onClick={clickHandler}
            className='hover:text-primary group flex items-center gap-2'
          >
            <p className='group-hover:text-primary hover-underline transition-colors duration-300'>View Categories</p>
            <Image
              src={ArrowRight}
              alt='Arrow Right'
              width={20}
              height={20}
              className='hidden opacity-50 transition-transform duration-300 ease-out group-hover:rotate-90 group-hover:opacity-100 md:block'
            />
          </Link>
        </div>
      </div>
      <div className='hidden w-fit flex-row flex-nowrap gap-2 overflow-x-scroll md:flex xl:gap-4'>
        {isLoading
          ? Array.from({ length: cardCount }).map((_, index) => (
              <div
                key={index}
                className='fadeIn h-[400px] w-[440px]'
                style={{ animationDelay: `${defaultAnimationdelay + index * 0.15}s` }}
              >
                <LoadingCell radius='8px' height={'400px'} width={'460px'} />
              </div>
            ))
          : categories?.slice(0, cardCount).map((category, index) => (
              <div
                key={category.name}
                className='bg-secondary fadeIn h-[400px] w-[440px]'
                onClick={() => {
                  setDropdownOption(null)
                }}
                style={{ animationDelay: `${defaultAnimationdelay + index * 0.15}s` }}
              >
                <CategoryRow category={category} reduceColumns={(width || 0) > 1600 ? true : false} />
              </div>
            ))}
      </div>
    </div>
  )
}

export default Categories
