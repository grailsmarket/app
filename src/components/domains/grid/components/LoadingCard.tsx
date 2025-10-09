import React, { RefObject } from 'react'
import LoadingCell from '@/app/ui/LoadingCell'

const LoadingCard = ({ ref }: { ref?: RefObject<HTMLDivElement> }) => {
  return (
    <div
      className={`ph-no-capture group flex flex-1 cursor-pointer flex-col gap-y-px`}
      ref={ref}
    >
      <div
        className={`gradient-gray flex h-[170px] w-full flex-col justify-between p-[21px]`}
      />
      <div className="flex w-full flex-1 flex-col justify-between bg-dark-700 ">
        <div className="flex w-full flex-col gap-2 bg-dark-700 pl-4 pt-4 ">
          <LoadingCell width="55%" />
          <LoadingCell width="35%" />
        </div>
        <div className="flex h-12 items-center pl-4">
          <LoadingCell width="40%" />
        </div>
      </div>
    </div>
  )
}

export default LoadingCard
