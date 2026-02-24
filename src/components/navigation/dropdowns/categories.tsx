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
import LoadingCell from '@/components/ui/loadingCell'
import { useAppDispatch } from '@/state/hooks'
import { changeCategoriesPageTab } from '@/state/reducers/categoriesPage/categoriesPage'
import { CATEGORIES_PAGE_TABS } from '@/constants/categories/categoriesPageTabs'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { ANIMATION_DELAY_INCREMENT, DEFAULT_ANIMATION_DELAY } from '@/constants/ui/navigation'

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
    if (width && width < 1024) return 8
    if (width && width < 1280) return 10
    if (width && width < 1536) return 12
    return 16
  }, [width])

  const gridColCount = useMemo(() => {
    if (width && width < 1024) return 2
    if (width && width < 1280) return 2
    if (width && width < 1536) return 3
    return 4
  }, [width])

  const defaultAnimationdelay = previousDropdownOption ? 0 : DEFAULT_ANIMATION_DELAY
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
      <div className='pl-lg md:pt-lg text-neutral flex h-fit w-56 flex-col gap-4 text-2xl font-semibold md:h-[370px] md:justify-between md:pl-0'>
        <div className='flex h-full w-fit flex-col gap-4'>
          <div className='fadeIn w-fit md:hidden' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/categories'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[0]))
                clickHandler()
              }}
            >
              Categories
            </Link>
          </div>
          <div className='fadeIn w-fit' style={{ animationDelay: `${defaultAnimationdelay}s` }}>
            <Link
              href='/categories?tab=names'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[0]))
                clickHandler()
              }}
            >
              Names
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT}s` }}
          >
            <Link
              href='/categories?tab=listings'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[2]))
                clickHandler()
              }}
            >
              Listings
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 2}s` }}
          >
            <Link
              href='/categories?tab=premium'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[3]))
                clickHandler()
              }}
            >
              Premium
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 3}s` }}
          >
            <Link
              href='/categories?tab=available'
              className='hover:text-primary hover-underline transition-all duration-200'
              onClick={() => {
                dispatch(changeCategoriesPageTab(CATEGORIES_PAGE_TABS[4]))
                clickHandler()
              }}
            >
              Available
            </Link>
          </div>
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 4}s` }}
          >
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
          <div
            className='fadeIn w-fit'
            style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 5}s` }}
          >
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
          className='md:py-md border-neutral slideInLeft hidden w-full md:block md:border-t'
          style={{ animationDelay: `${defaultAnimationdelay + ANIMATION_DELAY_INCREMENT * 6}s` }}
        >
          <Link
            href='/categories?tab=categories'
            onClick={clickHandler}
            className='hover:text-primary group flex items-center gap-2'
          >
            <p className='group-hover:text-primary hover-underline transition-colors duration-300'>View All</p>
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
      <div className='hidden max-h-[370px] w-fit flex-row flex-wrap gap-2 overflow-x-scroll overflow-y-auto md:grid md:grid-cols-2 xl:grid-cols-3 xl:gap-4 2xl:grid-cols-4'>
        {isLoading
          ? Array.from({ length: cardCount }).map((_, index) => (
            <div
              key={index}
              className='fadeIn h-[80px] w-full'
              style={{
                animationDelay: `${defaultAnimationdelay + ((index + 1) / gridColCount) * ANIMATION_DELAY_INCREMENT}s`,
              }}
            >
              <LoadingCell radius='8px' height={'80px'} width={'100%'} />
            </div>
          ))
          : categories?.map((category, index) => {
            const { avatar: categoryAvatar, header: categoryHeader } = getCategoryDetails(category.name)

            return (
              <Link
                href={`/categories/${category.name}`}
                key={category.name}
                className='bg-secondary fadeIn hover:bg-foreground/15 h-[80px] w-full cursor-pointer overflow-hidden rounded-md transition-colors duration-300'
                onClick={() => {
                  setDropdownOption(null)
                }}
                style={{
                  animationDelay: `${defaultAnimationdelay + ((index + 1) / gridColCount) * ANIMATION_DELAY_INCREMENT}s`,
                }}
              >
                <div className='p-lg relative flex max-h-[80px] min-h-[80px] flex-row items-center gap-3 overflow-hidden rounded-t-lg'>
                  <Image
                    src={categoryHeader}
                    alt={`${category.display_name} header`}
                    width={1000}
                    height={1000}
                    className='absolute top-0 left-0 h-full w-full object-cover opacity-20'
                  />
                  <div className='z-10 flex items-center gap-3'>
                    <Image
                      src={categoryAvatar}
                      alt={category.display_name}
                      width={54}
                      height={54}
                      className='rounded-full'
                    />
                    <div className='flex flex-col'>
                      <h3 className='text-2xl font-bold md:text-2xl'>{category.display_name}</h3>
                      <p className='text-neutral text-lg font-medium'>{category.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
      </div>
    </div>
  )
}

export default Categories
