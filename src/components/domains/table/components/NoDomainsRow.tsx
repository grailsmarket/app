import React from 'react'

const NoDomainsRow = () => {
  return (
    <div className={`group border-t-dark-900 bg-dark-800 h-[61px] w-full flex-1 cursor-pointer border-t p-4`}>
      <p className='text-label text-xs'>No domains available. Try changing your search term of filters.</p>
    </div>
  )
}

export default NoDomainsRow
