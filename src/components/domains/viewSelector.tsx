'use client'

import React, { useMemo } from 'react'
import Image from 'next/image'
import list from 'public/icons/list.svg'
import grid from 'public/icons/grid.svg'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { cn } from '@/utils/tailwind'
import Tooltip from '../ui/tooltip'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useWindowSize } from 'ethereum-identity-kit'
import { selectViewType, setViewType } from '@/state/reducers/view'

const ViewSelector = () => {
  const dispatch = useAppDispatch()
  const { actions, selectors } = useFilterRouter()
  const viewType = useAppSelector(selectViewType)
  const { width } = useWindowSize()
  const currentScrollTop = selectors.filters.scrollTop

  // Calculate columns for grid view based on container width
  const columnsInGrid = useMemo(() => {
    if (!width) return 3 // Default fallback

    // Calculate container width (matching logic from Domains component)
    let containerWidth = width
    if (width >= 1728) containerWidth = 1728 - 344
    else if (width < 768) containerWidth = width - 8
    else if (width < 1024) containerWidth = width - 48
    else containerWidth = width - 344

    const cardWidth = 200
    const gap = 4
    const availableWidth = containerWidth - gap
    return Math.floor(availableWidth / (cardWidth + gap)) || 1
  }, [width])

  const onChangeViewType = (newViewType: 'list' | 'grid') => {
    // Calculate new scroll position based on current position
    let newScrollTop = 0

    if (viewType === 'list' && newViewType === 'grid') {
      // Switching from list to grid
      const listRowHeight = 60
      const currentRow = Math.floor(currentScrollTop / listRowHeight)
      const gridRowHeight = (width && width < 420 ? 460 : width && width < 640 ? 350 : 330) + 4
      const gridRow = Math.floor(currentRow / columnsInGrid)
      newScrollTop = gridRow * gridRowHeight
    } else if (viewType === 'grid' && newViewType === 'list') {
      // Switching from grid to list
      const gridRowHeight = (width && width < 420 ? 460 : width && width < 640 ? 350 : 330) + 4
      const currentGridRow = Math.floor(currentScrollTop / gridRowHeight)
      const firstItemInRow = currentGridRow * columnsInGrid
      const listRowHeight = 60
      newScrollTop = firstItemInRow * listRowHeight
    }

    dispatch(setViewType(newViewType))
    dispatch(actions.setScrollTop(newScrollTop))
  }

  return (
    <div className='flex gap-x-2'>
      <Tooltip label='List view'>
        <button onClick={() => onChangeViewType('list')} className='h-6 w-6'>
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
        <button onClick={() => onChangeViewType('grid')} className='h-6 w-6'>
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
