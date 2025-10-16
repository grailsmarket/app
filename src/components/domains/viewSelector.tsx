'use client'

import React from 'react'
import Image from 'next/image'
import list from 'public/icons/list.svg'
import grid from 'public/icons/grid.svg'
import { selectMarketplaceDomains, setViewType } from '@/state/reducers/domains/marketplaceDomains'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { cn } from '@/utils/tailwind'
import Tooltip from '../ui/tooltip'

const ViewSelector = () => {
  const dispatch = useAppDispatch()
  const { viewType } = useAppSelector(selectMarketplaceDomains)

  return (
    <div className='flex gap-x-2'>
      <Tooltip label='List view'>
        <button onClick={() => dispatch(setViewType('list'))} className='h-6 w-6'>
          <Image
            src={list}
            alt='List layout'
            width={24}
            height={24}
            className={cn('cursor-pointer', viewType === 'list' ? 'opacity-100' : 'opacity-50 hover:opacity-80')}
          />
        </button>
      </Tooltip>
      <Tooltip label='Grid view'>
        <button onClick={() => dispatch(setViewType('grid'))} className='h-6 w-6'>
          <Image
            src={grid}
            alt='Grid layout'
            width={18}
            height={18}
            className={cn('cursor-pointer', viewType === 'grid' ? 'opacity-100' : 'opacity-50 hover:opacity-80')}
          />
        </button>
      </Tooltip>
    </div>
  )
}

export default ViewSelector
