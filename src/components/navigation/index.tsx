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
import search from 'public/icons/search.svg'
import Hamburger from './hamburger'

const Navigation = () => {
  return (
    <header className='px-lg bg-background fixed top-0 left-0 z-50 h-20 w-full'>
      <nav className='mx-auto flex h-full max-w-7xl items-center justify-between'>
        <div className='flex items-center gap-8'>
          <Link href='/'>
            <Image
              src={logoMobile}
              alt='Grails Market'
              width={40}
              height={40}
              className='cursor-pointer transition-all hover:opacity-80 sm:hidden'
            />
            <Image
              src={logo}
              alt='Grails Market'
              width={130}
              height={40}
              className='hidden min-h-[40px] min-w-[130px] cursor-pointer transition-all hover:opacity-80 sm:block'
            />
          </Link>
          <div className='hidden lg:block'>
            <Searchbar onSearch={() => {}} className='h-10 min-w-60' />
          </div>
          <Pages className='hidden md:flex' />
        </div>
        <div className='flex items-center justify-end gap-6'>
          <Image
            src={search}
            alt='Search'
            width={24}
            height={24}
            className='cursor-pointer transition-all hover:opacity-80 lg:hidden'
          />
          <Cart />
          <Notifications />
          <Hamburger />
          <SignInButton />
        </div>
      </nav>
    </header>
  )
}

export default Navigation
