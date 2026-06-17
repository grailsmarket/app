import { cn } from '@/utils/tailwind'
import React from 'react'

interface HamburgerProps {
  onClick: () => void
  isOpen: boolean
}

const Hamburger: React.FC<HamburgerProps> = ({ onClick, isOpen }) => {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
      className='flex shrink-0 cursor-pointer flex-col items-center justify-center gap-[6px] rounded-md transition-opacity hover:opacity-80 md:hidden md:gap-[7px]'
    >
      <div
        className={cn(
          'bg-foreground h-[2px] w-5 rounded-full transition-all duration-300 md:w-6',
          isOpen ? 'translate-y-2 rotate-45' : ''
        )}
      ></div>
      <div
        className={cn(
          'bg-foreground h-[2px] w-5 rounded-full transition-all duration-300 md:w-6',
          isOpen ? 'opacity-0' : ''
        )}
      ></div>
      <div
        className={cn(
          'bg-foreground h-[2px] w-5 rounded-full transition-all duration-300 md:w-6',
          isOpen ? '-translate-y-2 -rotate-45' : ''
        )}
      ></div>
    </button>
  )
}

export default Hamburger
