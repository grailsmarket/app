import Link from 'next/link'
import React from 'react'

const Pages = () => {
  return (
    <div className='flex items-center gap-4'>
      <Link href='/'>Home</Link>
      <Link href='/marketplace'>Explore</Link>
      <Link href='/portfolio'>Portfolio</Link>
    </div>
  )
}

export default Pages
