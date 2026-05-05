'use client'

import React from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectTwitterFeedConfig } from '@/state/reducers/dashboard/selectors'

interface TwitterFeedWidgetProps {
  instanceId: string
}

const TwitterFeedWidget: React.FC<TwitterFeedWidgetProps> = ({ instanceId }) => {
  const config = useAppSelector((state) => selectTwitterFeedConfig(state, instanceId))

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <div className='relative flex-1 overflow-hidden'>
        <iframe src="https://www.juicer.io/api/feeds/ensmarketbot/iframe" frameBorder="0" width="1000" height="1000" style={{ display: 'block', padding: '0px 2px', margin: '0 auto', width: '100%', height: '100%' }} title="ENSMarketBot - Juicer social media feed"></iframe>
      </div>
    </div>
  )
}

export default TwitterFeedWidget
