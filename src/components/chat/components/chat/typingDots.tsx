'use client'

import React from 'react'

const TypingDots: React.FC = () => (
  <div className='flex items-center gap-1' aria-label='typing'>
    <span className='bg-neutral h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
    <span className='bg-neutral h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
    <span className='bg-neutral h-2 w-2 animate-bounce rounded-full' />
  </div>
)

export default TypingDots
