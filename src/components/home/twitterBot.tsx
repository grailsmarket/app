'use client'

import Image from 'next/image'
import React from 'react'
import fast from 'public/icons/fast.svg'
import grailsAI from 'public/icons/grails-ai.svg'
import context from 'public/icons/context.svg'
import markets from 'public/icons/connected.svg'
import PrimaryButton from '../ui/buttons/primary'

const twitterBotDetails = [
  {
    title: 'Super Fast',
    description: 'Tweets within seconds of major events',
    icon: <Image src={fast} alt='Fast' width={20} height={20} />,
  },
  {
    title: 'GrailsAI Insight',
    description: 'Quick analysis in a reply of account history and market conditions.',
    icon: <Image src={grailsAI} alt='Fast' width={20} height={20} />,
  },
  {
    title: 'Full Context',
    description: 'All the relevant information, nicely displayed.',
    icon: <Image src={context} alt='Context' width={20} height={20} />,
  },
  {
    title: 'Across Markets',
    description: 'Aggregates from all important sources.',
    icon: <Image src={markets} alt='Markets' width={20} height={20} />,
  },
]

const TwitterBot = () => {
  const handleFollow = () => {
    window.open('https://x.com/ENSMarketBot', '_blank')
  }

  return (
    <div className='flex w-full flex-col-reverse gap-10 md:flex-row md:items-center md:justify-center'>
      <iframe
        loading='lazy'
        className='mx-auto aspect-[400/642] w-full max-w-[400px] md:mx-0 md:w-[340px] lg:w-[380px]'
        src='https://platform.twitter.com/embed/Tweet.html?frame=false&hideCard=false&hideThread=true&id=1990916043254972604&origin=YOUR_DOMAIN_HERE&theme=dark&width=500px'
        scrolling='no'
      ></iframe>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-3'>
          <h2 className='font-sedan-sc text-center text-5xl sm:text-6xl md:text-left'>Twitter Bot</h2>
          <p className='text-center text-xl font-semibold md:text-left'>
            Don’t miss a major sale, offer, or registration. Join the conversation on 𝕏.
          </p>
        </div>
        <div className='flex flex-col items-center gap-6 md:items-start'>
          {twitterBotDetails.map((detail) => (
            <div key={detail.title} className='flex flex-col items-center gap-2 md:items-start'>
              <div className='flex flex-row items-center gap-2'>
                {detail.icon}
                <h3 className='text-primary text-center text-2xl font-bold md:text-left'>{detail.title}</h3>
              </div>
              <p className='text-center font-medium md:text-left'>{detail.description}</p>
            </div>
          ))}
        </div>
        <PrimaryButton className='px-xl mx-auto mt-2 h-fit! py-3 text-xl md:mx-0' onClick={handleFollow}>
          Follow on &nbsp;𝕏
        </PrimaryButton>
      </div>
    </div>
  )
}

export default TwitterBot
