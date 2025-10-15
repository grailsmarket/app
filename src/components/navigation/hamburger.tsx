import React, { useState } from 'react'
import Pages from './pages'
import { useClickAway } from '@/hooks/useClickAway'

const Hamburger = () => {
  const [open, setOpen] = useState(false)
  const clickAwayRef = useClickAway<HTMLDivElement>(() => setOpen(false))

  return (
    <div className='group/hamburger md:hidden relative z-0 sm:z-50' ref={clickAwayRef}>
      <button onClick={() => setOpen(!open)} className='flex flex-col items-center cursor-pointer hover:opacity-80 justify-center gap-[7px] py-1.5'>
        {new Array(3).fill(0).map((_, index) => (
          <div key={index} className='bg-foreground h-[2px] w-6 rounded-full transition-all duration-300'></div>
        ))}
      </button>
      {open && (
        <div className='absolute top-10 -right-16 bg-secondary w-40 shadow-md p-lg rounded-md'>
          <Pages onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

export default Hamburger