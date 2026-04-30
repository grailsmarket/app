import { EXTRAS_ITEMS } from '@/constants/ui/footer'
import Link from 'next/link'
import React from 'react'

const Extras = () => {
  return (
    <section className='flex flex-col gap-4 text-lg'>
      {EXTRAS_ITEMS.map(({ label, href, target }) => (
        <Link
          key={href}
          href={href}
          target={target}
          className='text-foreground font-semibold opacity-80 transition-all hover:opacity-100'
        >
          <span>{label}</span>
        </Link>
      ))}
    </section>
  )
}

export default Extras
