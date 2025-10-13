import LoadingCell from '@/components/ui/loadingCell'
import React, { RefObject } from 'react'

const LoadingCard = ({ ref }: { ref?: RefObject<HTMLDivElement> }) => {
  return (
    <div
      className={` group flex flex-1 cursor-pointer flex-col gap-y-px`}
      ref={ref}
    >
      <div
        className={`gradient-gray flex h-[170px] w-full flex-col justify-between p-[21px]`}
      />
      <div className="flex w-full flex-1 flex-col justify-between ">
        <div className="flex w-full flex-col gap-2 pl-4 pt-4 ">
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
