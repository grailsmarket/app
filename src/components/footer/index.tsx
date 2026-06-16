import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Pages from './components/pages'
import Extras from './components/extras'
import Sources from './components/sources'
import logo from 'public/logo-w-text.svg'
import byEthId from 'public/by-ethid.svg'
import poweredByEIK from 'public/powered-by-eik.svg'

const Footer = () => {
  return (
    <footer className='glass-card shadow-footer border-t-primary z-20 mt-8 flex w-full items-center justify-center border-t py-8 @[40rem]/app:mt-12 @[48rem]/app:mt-20 @[64rem]/app:mt-24'>
      <div className='xxs:gap-6 flex h-full w-full max-w-5xl flex-col-reverse items-center justify-between gap-6 px-6 @[40rem]/app:flex-row @[40rem]/app:justify-between @[40rem]/app:gap-28 @[48rem]/app:gap-44'>
        <section className='flex gap-6 @[40rem]/app:flex-col!'>
          <Image
            src={logo}
            width={180}
            height={180}
            alt='Ethereum Follow Protocol'
            className='w-[120px] @[40rem]/app:w-[180px]'
            priority
          />
          <div className='flex items-center gap-3'>
            <Link href='https://ethid.org/' target='_blank' className='transition-opacity hover:opacity-80'>
              <Image
                src={byEthId}
                alt='Ethereum Identity Foundation'
                width={100}
                height={100}
                className='h-auto w-20 @[40rem]/app:w-24'
              />
            </Link>
            <div className='bg-foreground/50 h-9 w-0.5 rounded-full' />
            <Link href='https://ethidentitykit.com' target='_blank' className='transition-opacity hover:opacity-80'>
              <Image
                src={poweredByEIK}
                alt='Powered by Ethereum Identity Kit'
                width={120}
                height={36}
                className='h-auto w-28 @[40rem]/app:w-32'
              />
            </Link>
          </div>
        </section>
        <div className='flex w-full flex-row items-start justify-between gap-4 @[40rem]/app:w-2/3 @[40rem]/app:justify-between @[40rem]/app:gap-8'>
          <Pages />
          <Extras />
          <Sources />
        </div>
      </div>
    </footer>
  )
}

export default Footer
