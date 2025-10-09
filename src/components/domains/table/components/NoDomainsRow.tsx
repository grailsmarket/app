import React from 'react'

const NoDomainsRow = () => {
  return (
    <div
      className={`group h-[61px] w-full flex-1 cursor-pointer border-t border-t-dark-900 bg-dark-800 p-4`}
    >
      <p className="text-xs text-label">
        No domains available. Try changing your search term of filters.
      </p>
    </div>
  )
}

export default NoDomainsRow
