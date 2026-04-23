import LoadingCell from '@/components/ui/loadingCell'
import React from 'react'

const NotificationLoadingRow = () => {
  return (
    <div className='p-lg flex w-full items-center justify-between gap-4'>
      <div className='flex w-2/5 items-center gap-2'>
        <LoadingCell height='32px' width='30px' radius='4px' />
        <div className='flex flex-col gap-0.5'>
          <LoadingCell height='14px' width='100px' radius='2px' />
          <LoadingCell height='10px' width='80px' radius='1px' />
        </div>
      </div>
      <div className='flex w-2/5 items-center gap-2'>
        <LoadingCell height='32px' width='32px' radius='4px' />
        <LoadingCell height='22px' width='90px' radius='4px' />
      </div>
      <div className='flex w-1/5 justify-end'>
        <LoadingCell height='22px' width='90px' radius='4px' />
      </div>
    </div>
  )
}

export default NotificationLoadingRow
