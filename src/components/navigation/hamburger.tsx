import React, { useState } from 'react'
import Pages from './pages'
import { useClickAway } from '@/hooks/useClickAway'

const Hamburger = () => {
  const [open, setOpen] = useState(false)
  const clickAwayRef = useClickAway<HTMLDivElement>(() => setOpen(false))

  return (
    <div className='group/hamburger relative z-0 sm:z-50 md:hidden' ref={clickAwayRef}>
      <button
        onClick={() => setOpen(!open)}
        className='flex cursor-pointer flex-col items-center justify-center gap-[6px] py-1.5 hover:opacity-80 md:gap-[7px]'
      >
        {new Array(3).fill(0).map((_, index) => (
          <div key={index} className='bg-foreground h-[2px] w-5 rounded-full transition-all duration-300 md:w-6'></div>
        ))}
      </button>
      {open && (
        <div className='bg-secondary p-lg absolute top-10 -right-16 w-40 rounded-md shadow-md'>
          <Pages onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default Hamburger
