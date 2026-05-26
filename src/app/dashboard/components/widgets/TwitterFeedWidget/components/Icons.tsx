import React from 'react'

export const PlayIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-6 w-6 text-white' aria-hidden='true'>
    <path fill='currentColor' d='M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z' />
  </svg>
)

export const CloseIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-5 w-5' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M18.3 5.71 12 12.01l-6.29-6.3-1.42 1.42L10.59 13.43l-6.3 6.29 1.42 1.42L12 14.84l6.3 6.3 1.41-1.42-6.29-6.29 6.29-6.3z'
    />
  </svg>
)

export const ReplyIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M1.75 11.5C1.75 6.8 5.75 3 11 3s9.25 3.8 9.25 8.5S16.25 20 11 20c-.9 0-1.77-.11-2.58-.32l-4.2 1.22c-.71.21-1.36-.44-1.15-1.15l1.15-3.86A8.08 8.08 0 0 1 1.75 11.5Zm9.25-7C6.58 4.5 3.25 7.58 3.25 11.5c0 1.33.39 2.57 1.08 3.62l.18.27-.85 2.86 3.05-.89.25.08c1.19.38 2.53.56 4.04.56 4.42 0 7.75-3.08 7.75-6.5S15.42 4.5 11 4.5Z'
    />
  </svg>
)

export const RepostIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M4.5 7.5h10.1l-2.3-2.3 1.1-1.1 4.1 4.1-4.1 4.1-1.1-1.1 2.3-2.2H6v6H4.5v-7.5Zm15 9H9.4l2.3 2.3-1.1 1.1-4.1-4.1 4.1-4.1 1.1 1.1L9.4 15H18V9h1.5v7.5Z'
    />
  </svg>
)

export const LikeIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M16.7 3.25c-1.74 0-3.31.82-4.3 2.09a5.42 5.42 0 0 0-4.3-2.09c-3.03 0-5.45 2.48-5.45 5.56 0 3.1 2.12 5.54 4.11 7.18 1.77 1.46 3.87 2.79 4.96 3.43.42.25.94.25 1.36 0 1.09-.64 3.19-1.97 4.96-3.43 1.99-1.64 4.11-4.08 4.11-7.18 0-3.08-2.42-5.56-5.45-5.56Zm.38 11.58c-1.62 1.34-3.57 2.57-4.68 3.23-1.11-.66-3.06-1.89-4.68-3.23-1.85-1.52-3.57-3.56-3.57-6.02 0-2.26 1.76-4.06 3.95-4.06 1.74 0 3.2 1.12 3.7 2.66h1.2c.5-1.54 1.96-2.66 3.7-2.66 2.19 0 3.95 1.8 3.95 4.06 0 2.46-1.72 4.5-3.57 6.02Z'
    />
  </svg>
)

export const ViewIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M8.75 21V9.75h2.5V21h-2.5Zm-5 0v-7.25h2.5V21h-2.5Zm10 0V3h2.5v18h-2.5Zm5 0V7.25h2.5V21h-2.5Z'
    />
  </svg>
)

export const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox='0 0 24 24' className={className} aria-hidden='true'>
    <path fill='currentColor' d='m9.71 18.71-1.42-1.42L13.59 12l-5.3-5.29 1.42-1.42L16.41 12l-6.7 6.71Z' />
  </svg>
)
