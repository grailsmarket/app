import React from 'react'
import { LoadingCell } from 'ethereum-identity-kit'

export const PostSkeletonList: React.FC = () => (
  <>
    {Array.from({ length: 3 }).map((_, index) => (
      <PostSkeleton key={index} />
    ))}
  </>
)

export const PostSkeleton: React.FC = () => (
  <div className='border-b border-[#2f3336] px-4 py-3'>
    <div className='flex gap-3'>
      <LoadingCell height='40px' width='40px' radius='50%' />
      <div className='min-w-0 flex-1 space-y-2'>
        <LoadingCell height='14px' width='60%' />
        <LoadingCell height='14px' width='90%' />
        <LoadingCell height='14px' width='75%' />
        <LoadingCell height='160px' width='100%' radius='16px' />
      </div>
    </div>
  </div>
)

export const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
    <div className='text-base font-bold text-[#e7e9ea]'>Posts are unavailable</div>
    <div className='mt-1 text-sm text-[#71767b]'>{message}</div>
  </div>
)

export const EmptyState: React.FC<{ handle: string }> = ({ handle }) => (
  <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
    <div className='text-base font-bold text-[#e7e9ea]'>No posts yet</div>
    <div className='mt-1 text-sm text-[#71767b]'>@{handle} does not have any original posts or replies to show.</div>
  </div>
)

export const MediaFallback: React.FC = () => (
  <div className='flex h-full w-full items-center justify-center text-sm text-[#71767b]'>Media unavailable</div>
)
