import React from 'react'
import Image from 'next/image'
import logo from 'public/logo-w-text.png'
import Pages from './components/pages'
import Sources from './components/sources'
import Link from 'next/link'
import byEthId from 'public/by-ethid.svg'

const Footer = () => {
  return (
    <footer className='glass-card shadow-footer border-t-primary z-20 mt-8 flex w-full items-center justify-center border-t-1 py-8 sm:mt-12 md:mt-20 lg:mt-24'>
      <div className='xxs:gap-6 flex h-full w-full items-start justify-between gap-6 px-6 sm:justify-center sm:gap-28 md:gap-44'>
        <section className='flex flex-col gap-6'>
          <Image
            src={logo}
            width={180}
            height={180}
            alt='Ethereum Follow Protocol'
            className='w-[120px] sm:w-[180px]'
          />
          <Link href='https://ethid.org/' target='_blank' className='transition-opacity hover:opacity-80'>
            <Image
              src={byEthId}
              alt='Ethereum Identity Foundation'
              width={100}
              height={100}
              className='h-auto w-20 sm:w-24'
            />
          </Link>
        </section>
        <section className='flex align-middle'>
          <div className='flex flex-col gap-4 sm:gap-6'>
            <Pages />
          </div>
        </section>
        <section className='flex'>
          <div className='flex flex-col gap-4 sm:gap-6'>
            <Sources />
          </div>
        </section>
      </div>
    </footer>
  )
}

export default Footer
