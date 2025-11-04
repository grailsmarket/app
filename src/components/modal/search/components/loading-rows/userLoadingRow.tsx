import LoadingCell from '@/components/ui/loadingCell'
import React from 'react'

const UserLoadingRow = () => {
  return (
    <div className='flex items-center gap-2 p-3'>
      <LoadingCell height='36px' width='36px' radius='50%' />
      <LoadingCell height='24px' width='120px' />
    </div>
  )
}

export default UserLoadingRow
