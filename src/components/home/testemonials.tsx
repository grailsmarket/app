'use client'

import { TESTEMONIAL_QUOTES } from '@/constants/ui/testemonials'
import Image from 'next/image'
import React from 'react'
import quotes from 'public/icons/quotes.svg'
import User from '../ui/user'
import { Address } from 'viem'

export default function Testemonials() {
  return (
    <div className='flex flex-col justify-center gap-8 w-full'>
      <h2 className='text-6xl font-sedan-sc'>What people <span className='text-primary'>say</span> about Grails</h2>

      <div className='flex flex-row justify-center items-stretch gap-4'>
        {TESTEMONIAL_QUOTES.map((testimonial) => (
          <div key={testimonial.address} className='flex flex-col gap-4 bg-secondary pt-5 rounded-lg justify-between w-1/3'>
            <div className='flex flex-col px-5 gap-4'>
              <Image src={quotes} alt='Quotes' width={24} height={24} />
              <p className='text-[18px]'>{testimonial.quote}</p>
            </div>
            <User address={testimonial.address as Address} className='w-full h-16 px-5 gap-2 rounded-b-lg' avatarSize='40px' fontSize='18px' />
          </div>
        ))}
      </div>
    </div>
  )
}
