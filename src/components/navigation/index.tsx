'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import logo from 'public/logo-w-text.png'
import logoMobile from 'public/logo.png'
import Link from 'next/link'
import Searchbar from '../ui/searchbar'
import Pages from './pages'
import SignInButton from '../ui/buttons/signInButton/index'
import Cart from './cart'
import Notifications from './notifications'
import Hamburger from './hamburger'
import Watchlist from './watchlist'
import SearchIcon from './searchIcon'
import { cn } from '@/utils/tailwind'

const Navigation = ({ showInfo }: { showInfo: boolean }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

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

  return (
    <header
      className={cn(
        'bg-background border-tertiary app:border-r-2 app:border-l-2 sticky top-0 left-0 z-50 mx-auto h-14 w-full max-w-[2340px] border-b-2 backdrop-blur-md transition-transform duration-300 md:h-18',
        showInfo ? 'mt-6' : '',
        !isVisible ? '-translate-y-full md:translate-y-0' : 'translate-y-0'
      )}
    >
      <nav className='px-md md:px-lg lg:px-xl mx-auto flex h-full max-w-[2340px] items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/'>
            <Image
              src={logoMobile}
              alt='Grails Market'
              width={32}
              height={32}
              className='h-7 w-auto cursor-pointer transition-all hover:opacity-80 md:h-9 lg:hidden'
            />
            <Image
              src={logo}
              alt='Grails Market'
              width={130}
              height={40}
              className='hidden h-[39px] w-[124px] cursor-pointer transition-all hover:opacity-80 lg:block'
            />
          </Link>
          <div className='hidden lg:block'>
            <Searchbar onSearch={() => {}} className='h-10 w-48' />
          </div>
          <Pages className='hidden md:flex' />
        </div>
        <div className='flex items-center justify-end gap-3 md:gap-5'>
          <div className='flex items-center gap-3'>
            <SearchIcon />
            <Cart />
            <Notifications />
            <Watchlist />
            <Hamburger />
          </div>
          <SignInButton />
        </div>
      </nav>
    </header>
  )
}

export default Navigation
