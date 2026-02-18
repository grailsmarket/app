'use client'

import React, { useState, useEffect } from 'react'
import Cart from './cart'
import Pages from './pages'
import Link from 'next/link'
import Image from 'next/image'
import Hamburger from './hamburger'
import Watchlist from './watchlist'
import SearchIcon from './searchIcon'
import { cn } from '@/utils/tailwind'
import Searchbar from '../ui/searchbar'
import logoMobile from 'public/logo.png'
import logo from 'public/logo-w-text.png'
import Notifications from './notifications'
import { useNavbar } from '@/context/navbar'
import { useAppSelector } from '@/state/hooks'
import SignInButton from '../ui/buttons/signInButton/index'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { selectProfileListingsFilters } from '@/state/reducers/filters/profileListingsFilter'
import { selectCategoryDomainsFilters } from '@/state/reducers/filters/categoryDomainsFilters'
import Explore from './dropdowns/explore'
import Categories from './dropdowns/categories'
import CrossIcon from 'public/icons/cross.svg'
import Analytics from './dropdowns/analytics'
import Premium from './dropdowns/premium'

const Navigation = ({ showInfo }: { showInfo: boolean }) => {
  const [dropdownOption, setDropdownOption] = useState<string | null>(null)
  const [previousDropdownOption, setPreviousDropdownOption] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { setNavbarVisible } = useNavbar()

  // Check if any filter panel is open
  const marketplaceFilters = useAppSelector(selectMarketplaceFilters)
  const profileFilters = useAppSelector(selectProfileListingsFilters)
  const categoryFilters = useAppSelector(selectCategoryDomainsFilters)
  const isAnyFilterOpen = marketplaceFilters.open || profileFilters.open || categoryFilters.open

  // Compute effective visibility (visible if scrolled up OR filters are open)
  const effectiveVisibility = isVisible || isAnyFilterOpen || !!dropdownOption

  // Update context whenever effective visibility changes
  useEffect(() => {
    setNavbarVisible(effectiveVisibility)
  }, [effectiveVisibility, setNavbarVisible])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show navbar when scrolling up or at top, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleDropdownOption = (option: string | null) => {
    setPreviousDropdownOption(dropdownOption)
    setDropdownOption(option)
  }

  useEffect(() => {
    if (dropdownOption === null) {
      setTimeout(() => {
        setPreviousDropdownOption(null)
      }, 400)
    }
  }, [dropdownOption])

  return (
    <header
      onMouseLeave={() => {
        setPreviousDropdownOption(dropdownOption)
        setDropdownOption(null)
      }}
      className={cn(
        'bg-background border-tertiary app:border-r-2 app:border-l-2 sticky top-0 left-0 z-50 mx-auto h-14 w-full max-w-[2340px] border-b-2 transition-transform duration-300 md:h-18',
        showInfo ? 'mt-6' : '',
        !effectiveVisibility ? '-translate-y-full' : 'translate-y-0'
      )}
    >
      <nav className='px-md md:px-lg lg:px-xl bg-background relative z-20 mx-auto flex h-full max-w-[2340px] items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link
            href='/'
            onMouseEnter={() => {
              setPreviousDropdownOption(dropdownOption)
              handleDropdownOption(null)
            }}
          >
            <Image
              src={logoMobile}
              alt='Grails Market'
              width={32}
              height={32}
              className='h-7 w-auto cursor-pointer transition-all hover:opacity-80 md:h-9 xl:hidden'
            />
            <Image
              src={logo}
              alt='Grails Market'
              width={130}
              height={40}
              className='hidden h-[39px] w-[124px] cursor-pointer transition-all hover:opacity-80 xl:block'
            />
          </Link>
          <div className='hidden lg:block'>
            <Searchbar onSearch={() => {}} className='h-10 w-48' placeholder='Search (type /)' />
          </div>
          <Pages
            className='hidden md:flex'
            setDropdownOption={handleDropdownOption}
            dropdownOption={dropdownOption}
            onClick={() => {
              setPreviousDropdownOption(dropdownOption)
              setDropdownOption(null)
            }}
          />
        </div>
        <div
          className='flex items-center justify-end gap-3 md:gap-3.5'
          onMouseEnter={() => {
            setPreviousDropdownOption(dropdownOption)
            handleDropdownOption(null)
          }}
        >
          <div className='flex items-center gap-2.5'>
            <SearchIcon />
            <Cart />
            <Notifications />
            <Watchlist />
            <Hamburger
              onClick={() => {
                setPreviousDropdownOption(dropdownOption)
                setDropdownOption(dropdownOption === 'explore' ? null : 'explore')
              }}
              isOpen={dropdownOption === 'explore'}
            />
          </div>
          <SignInButton />
        </div>
      </nav>
      <div
        className={cn(
          'p-lg md:p-xl pt-md border-tertiary bg-background/80 absolute top-14 left-0 z-0 flex h-[calc(100dvh-56px)] w-full flex-col gap-4 overflow-y-scroll border-b-2 backdrop-blur-md transition-all duration-500 ease-out md:top-16 md:h-fit md:shadow-md md:duration-350 starting:-translate-y-full',
          dropdownOption ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <div
          className='px-md py-md flex items-center gap-1.5 opacity-70 md:hidden'
          onClick={() => {
            setPreviousDropdownOption(dropdownOption)
            setDropdownOption(null)
          }}
        >
          <Image src={CrossIcon} alt='Cross' width={14} height={14} />
          <p>Close</p>
        </div>
        <div
          className={cn(
            'border-neutral w-full border-b-2 md:border-none',
            dropdownOption === 'explore' || (dropdownOption === null && previousDropdownOption === 'explore')
              ? 'block'
              : 'block md:hidden'
          )}
        >
          <Explore setDropdownOption={handleDropdownOption} previousDropdownOption={previousDropdownOption} />
        </div>
        <div
          className={cn(
            'border-neutral w-full border-b-2 md:border-none',
            dropdownOption === 'premium' || (dropdownOption === null && previousDropdownOption === 'premium')
              ? 'block'
              : 'block md:hidden'
          )}
        >
          <Premium setDropdownOption={handleDropdownOption} previousDropdownOption={previousDropdownOption} />
        </div>
        <div
          className={cn(
            'border-neutral w-full border-b-2 md:border-none',
            dropdownOption === 'categories' || (dropdownOption === null && previousDropdownOption === 'categories')
              ? 'block'
              : 'block md:hidden'
          )}
        >
          <Categories setDropdownOption={handleDropdownOption} previousDropdownOption={previousDropdownOption} />
        </div>
        {/* <div
          className={cn(
            'border-neutral w-full border-b-2 md:border-none',
            dropdownOption === 'leaderboard' || (dropdownOption === null && previousDropdownOption === 'leaderboard')
              ? 'block'
              : 'block md:hidden'
          )}
        >
          <Leaderboard setDropdownOption={handleDropdownOption} previousDropdownOption={previousDropdownOption} />
        </div> */}
        <div
          className={cn(
            'border-neutral w-full border-b-2 md:border-none',
            dropdownOption === 'analytics' || (dropdownOption === null && previousDropdownOption === 'analytics')
              ? 'block'
              : 'block md:hidden'
          )}
        >
          <Analytics setDropdownOption={handleDropdownOption} previousDropdownOption={previousDropdownOption} />
        </div>
      </div>
    </header>
  )
}

export default Navigation
