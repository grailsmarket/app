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
    <div className='flex w-full flex-col-reverse gap-10 @[48rem]/app:flex-row @[48rem]/app:items-center @[48rem]/app:justify-center'>
      <iframe
        loading='lazy'
        className='mx-auto aspect-[400/642] w-full max-w-[400px] @[48rem]/app:mx-0 @[48rem]/app:w-[340px] @[64rem]/app:w-[380px]'
        src='https://platform.twitter.com/embed/Tweet.html?frame=false&hideCard=false&hideThread=true&id=1990916043254972604&origin=YOUR_DOMAIN_HERE&theme=dark&width=500px'
        scrolling='no'
      ></iframe>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-3'>
          <h2 className='font-sedan-sc text-center text-5xl @[40rem]/app:text-6xl @[48rem]/app:text-left'>
            Twitter Bot
          </h2>
          <p className='text-center text-xl font-semibold @[48rem]/app:text-left'>
            Don’t miss a major sale, offer, or registration. Join the conversation on 𝕏.
          </p>
        </div>
        <div className='flex flex-col items-center gap-6 @[48rem]/app:items-start'>
          {twitterBotDetails.map((detail) => (
            <div key={detail.title} className='flex flex-col items-center gap-2 @[48rem]/app:items-start'>
              <div className='flex flex-row items-center gap-2'>
                {detail.icon}
                <h3 className='text-primary text-center text-2xl font-bold @[48rem]/app:text-left'>{detail.title}</h3>
              </div>
              <p className='text-center font-medium @[48rem]/app:text-left'>{detail.description}</p>
            </div>
          ))}
        </div>
        <PrimaryButton className='px-xl mx-auto mt-2 h-fit! py-3 text-xl @[48rem]/app:mx-0' onClick={handleFollow}>
          Follow on &nbsp;𝕏
        </PrimaryButton>
      </div>
    </div>
  )
}

export default TwitterBot
