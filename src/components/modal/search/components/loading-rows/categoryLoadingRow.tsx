import LoadingCell from '@/components/ui/loadingCell'
import React from 'react'

const ClubLoadingRow = () => {
  return (
    <div className='flex items-center justify-between p-3'>
      <div className='flex items-center gap-2'>
        <LoadingCell height='36px' width='36px' radius='50%' />
        <div className='flex flex-col gap-1'>
          <LoadingCell height='18px' width='120px' radius='3px' />
          <LoadingCell height='14px' width='80px' radius='2px' />
        </div>
      </div>
      <LoadingCell height='20px' width='60px' radius='4px' />
    </div>
  )
}

export default ClubLoadingRow
