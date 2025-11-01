import React, { Ref } from 'react'
import { cn } from '@/utils/tailwind'
import { useUserContext } from '@/context/user'
import { Cross, useOutsideClick } from 'ethereum-identity-kit'

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
        className='bg-background border-primary justify-between p-2xl h-full w-1/2 max-w-2xl rounded-tl-lg rounded-bl-lg border-l-2 starting:translate-x-full transition-all duration-300'
      >
        <div className='flex flex-row items-center justify-between'><h2 className='font-sedan-sc text-3xl'>Cart</h2><Cross className='cursor-pointer hover:opacity-80 h-5 w-5' onClick={() => setIsCartOpen(false)} /></div>
        <div className='flex flex-col gap-2'>
          <h3 className='font-sedan-sc text-2xl'>Items</h3>
        </div>
        <div className='flex flex-col gap-2 bg-background border-t-2 border-primary'>
          <h3 className='font-sedan-sc text-2xl'>Checkout</h3>
        </div>
      </div>
    </div>
  )
}

export default Cart
