import { cn } from '@/utils/tailwind'
import React from 'react'

interface HamburgerProps {
  onClick: () => void
  isOpen: boolean
}

const Hamburger: React.FC<HamburgerProps> = ({ onClick, isOpen }) => {
  return (
    <button
      onClick={onClick}
      className='flex cursor-pointer flex-col items-center justify-center gap-[6px] py-1.5 hover:opacity-80 md:hidden md:gap-[7px]'
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
          isOpen ? '-translate-y-2 rotate-[-45deg]' : ''
        )}
      ></div>
    </button>
  )
}

export default Hamburger
