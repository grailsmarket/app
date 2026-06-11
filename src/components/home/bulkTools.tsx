'use client'

import React from 'react'
import Image from 'next/image'
import search from 'public/icons/search-primary.svg'
import listings from 'public/icons/tag.svg'
import extend from 'public/icons/extend.svg'
import transfer from 'public/icons/transfer-primary.svg'
import register from 'public/icons/registration-primary.svg'
import editRecords from 'public/icons/pencil-primary.svg'
import { setSearchModalOpen } from '@/state/reducers/modals/searchModal'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/state/hooks'
import { setBulkSelectIsSelecting } from '@/state/reducers/modals/bulkSelectModal'
import { changeCategoriesPageTab } from '@/state/reducers/categoriesPage/categoriesPage'

const bulkTools = [
  {
    title: 'Register',
    description: 'Register multiple names in one transaction. Set custom durations for each name.',
    icon: <Image src={register} alt='Register' width={24} height={24} />,
  },

  {
    title: 'Listings',
    description: 'List multiple names at once with different prices.',
    icon: <Image src={listings} alt='Listings' width={20} height={20} />,
  },
  {
    title: 'Extend',
    description: 'Renew multiple names at once, even from an account that’s not the owner.',
    icon: <Image src={extend} alt='Extend' width={24} height={24} />,
  },
  {
    title: 'Transfer',
    description: 'Transfer multiple names in one transaction.',
    icon: <Image src={transfer} alt='Transfer' width={24} height={24} />,
  },
  {
    title: 'Search',
    description: 'Up to 10k search terms separated by commas or spaces.',
    icon: <Image src={search} alt='Search' width={20} height={20} />,
  },
  {
    title: 'Edit Records',
    description: 'Edit records for multiple names. Set records for all at once or individually.',
    icon: <Image src={editRecords} alt='Edit Records' width={24} height={24} />,
  },
]

const BulkTools = () => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()

  const handleToolClick = (tool: (typeof bulkTools)[number]) => {
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
    <div className='flex w-full flex-col justify-between gap-8 @[80rem]/app:flex-row'>
      <div className='flex w-full flex-col items-center gap-7 @[64rem]/app:items-start'>
        <div className='flex flex-col gap-4'>
          <h2 className='font-sedan-sc text-center text-5xl @[48rem]/app:text-6xl @[64rem]/app:text-left'>
            Bulk Tools
          </h2>
          <p className='text-center font-semibold @[40rem]/app:text-2xl @[64rem]/app:text-left'>
            Save gas and time. For serious domainers.
          </p>
        </div>
        <div className='flex flex-row flex-wrap gap-4'>
          {bulkTools.map((tool) => (
            <div
              className='hover:bg-primary/15 border-primary p-lg flex w-full cursor-pointer flex-col gap-2 rounded-md border-1 transition-colors @[40rem]/app:w-[calc(50%-8px)] @[64rem]/app:w-[calc(33%-12px)]'
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
        className='mx-auto h-fit w-full max-w-[800px] @[64rem]/app:mx-0 @[80rem]/app:w-1/2'
      /> */}
    </div>
  )
}

export default BulkTools
