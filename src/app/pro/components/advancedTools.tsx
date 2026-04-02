'use client'

import React from 'react'
import Image from 'next/image'
import listings from 'public/icons/tag.svg'
import register from 'public/icons/registration-primary.svg'
import { setSearchModalOpen } from '@/state/reducers/modals/searchModal'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/state/hooks'
import { setBulkSelectIsSelecting } from '@/state/reducers/modals/bulkSelectModal'
import { changeCategoriesPageTab } from '@/state/reducers/categoriesPage/categoriesPage'
import Search from 'public/icons/search-primary.svg'
import Grid from 'public/icons/grid-primary.svg'
import Watchlist from 'public/icons/watchlist-primary.svg'
import Message from 'public/icons/chat.svg'
import Notification from 'public/icons/bell-primary.svg'
import View from 'public/icons/view-primary.svg'
import grailsAI from 'public/icons/grails-ai.svg'

const tools = [
  {
    title: 'Bulk Offers',
    description: 'Create offers for multiple names at the same time.',
    icon: <Image src={register} alt='Register' width={24} height={24} />,
  },
  {
    title: 'Google Metrics Filters',
    description: 'Filter names by various google Google metrics like searches, CPC, and more.',
    icon: <Image src={Search} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Custom Dashboard',
    description: 'Create your custom dashboard. Add widgets to your dashboard to track your favorite metrics.',
    icon: <Image src={Grid} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Multiple Watchlists',
    description: 'Create multiple watchlists to track your favorite names.',
    icon: <Image src={Watchlist} alt='Listings' width={24} height={24} />,
  },
  {
    title: 'Private Chat Group',
    description:
      'Get access to the exclusive Grails Pro chat group, where you can chat with biggest domainers in the game.',
    icon: <Image src={Message} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Feature Notifications',
    description: 'Be the first to know about new features and updates to Grails.',
    icon: <Image src={Notification} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'See view details',
    description: 'See exactly who and when viewed your profile or name pages.',
    icon: <Image src={View} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'AI Search',
    description: 'Get AI recommended search terms based on your search history and market conditions.',
    icon: <Image src={grailsAI} alt='Listings' width={20} height={20} />,
  },
]

const AdvancedTools = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()

  const handleToolClick = (tool: (typeof tools)[number]) => {
    if (tool.title === 'Search') {
      dispatch(setSearchModalOpen(true))
      return
    }

    if (tool.title === 'Register') {
      router.push('/categories?tab=available')
      dispatch(changeCategoriesPageTab({ label: 'Available', value: 'available' }))
      return
    }

    if (userAddress) {
      dispatch(setBulkSelectIsSelecting(true))
      router.push(`/profile/${userAddress}`)
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }

    openConnectModal?.()
  }
  return (
    <div className='flex w-full flex-col justify-between gap-8 xl:flex-row'>
      <div className='flex w-full flex-col items-center gap-7 lg:items-start'>
        {/* <div className='flex flex-col gap-4'>
          <h2 className='font-sedan-sc text-center text-5xl md:text-6xl lg:text-left'>Professional Domainer Tools</h2>
          <p className='text-center font-semibold sm:text-2xl lg:text-left'>
            Save gas and time. For serious domainers.
          </p>
        </div> */}
        <div className='flex w-full flex-row flex-wrap gap-4'>
          {tools.map((tool) => (
            <div
              className='hover:bg-primary/15 border-primary p-lg flex w-full cursor-pointer flex-col gap-2 rounded-md border-1 transition-colors sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]'
              key={tool.title}
              onClick={() => handleToolClick(tool)}
            >
              <div className='flex flex-row gap-2'>
                {tool.icon}
                <h3 className='text-primary text-2xl font-bold'>{tool.title}</h3>
              </div>
              <p className='text-lg font-medium'>{tool.description}</p>
            </div>
          ))}
        </div>
      </div>
      {/* <Image
        src={bulkToolsImage}
        alt='Bulk Tools'
        width={1200}
        height={600}
        className='mx-auto h-fit w-full max-w-[800px] lg:mx-0 xl:w-1/2'
      /> */}
    </div>
  )
}

export default AdvancedTools
