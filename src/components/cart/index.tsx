import React, { Ref } from 'react'
import { cn } from '@/utils/tailwind'
import { useUserContext } from '@/context/user'
import { useOutsideClick } from 'ethereum-identity-kit'

const Cart = () => {
  const { isCartOpen, setIsCartOpen } = useUserContext()

  const cartRef = useOutsideClick(() => {
    setIsCartOpen(false)
  })

  return (
    <div
      className={cn('fixed top-0 right-0 z-50 h-full w-full justify-end bg-black/50', isCartOpen ? 'flex' : 'hidden')}
    >
      <div
        ref={cartRef as Ref<HTMLDivElement>}
        className='bg-background border-primary p-lg h-full w-1/2 max-w-2xl rounded-tl-lg rounded-bl-lg border-l-2'
      >
        <h2 className='font-sedan-sc text-3xl'>Cart</h2>
        <div className='flex flex-col gap-2'>
          <div className='flex flex-col gap-2'>
            <h3 className='font-sedan-sc text-2xl'>Items</h3>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
