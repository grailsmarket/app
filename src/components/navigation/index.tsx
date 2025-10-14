import Image from 'next/image'
import React from 'react'
import logo from 'public/logo-w-text.png'
import Link from 'next/link'
import Searchbar from '../ui/searchbar'
import Pages from './pages'
import SignInButton from '../ui/buttons/signInButton/index'

const Navigation = () => {
  return (
    <header className='fixed top-0 left-0 z-50 h-20 w-full'>
      <nav className='mx-auto flex h-full max-w-7xl items-center justify-between'>
        <div className='flex items-center gap-8'>
          <Link href='/'>
            <Image
              src={logo}
              alt='Grails Market'
              width={130}
              height={40}
              className='min-h-[40px] min-w-[130px] cursor-pointer transition-all hover:opacity-80'
            />
          </Link>
          <Searchbar onSearch={() => {}} className='h-10 min-w-60' />
          <Pages />
        </div>
        <div className='flex items-center justify-end gap-4'>
          <SignInButton />
        </div>
      </nav>
    </header>
  )
}

export default Navigation
