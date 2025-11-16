import Image from 'next/image'
import React from 'react'
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

const Navigation = () => {
  return (
    <header className='px-lg bg-background border-tertiary fixed top-0 left-0 z-50 h-16 w-full border-b-2 backdrop-blur-md md:h-20'>
      <nav className='mx-auto flex h-full max-w-7xl items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/'>
            <Image
              src={logoMobile}
              alt='Grails Market'
              width={32}
              height={32}
              className='cursor-pointer transition-all hover:opacity-80 lg:hidden'
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
        <div className='flex items-center justify-end gap-5'>
          <div className='flex items-center gap-4'>
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
