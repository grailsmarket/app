import LoadingCell from '@/components/ui/loadingCell'
import React from 'react'

const NameLoadingRow = () => {
  return (
    <div className='flex items-center gap-2 p-3'>
      <LoadingCell height='36px' width='36px' radius='4px' />
      <LoadingCell height='22px' width='90px' />
    </div>
  )
}

export default NameLoadingRow
