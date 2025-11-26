import React from 'react'
import Image from 'next/image'
import cart from 'public/icons/cart.svg'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'

const Cart = () => {
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)
  const { setIsCartOpen } = useUserContext()

  const totalCartItems = cartRegisteredDomains.length + cartUnregisteredDomains.length

  const handleOpenCart = () => {
    setIsCartOpen(true)
  }

  return (
    <div onClick={handleOpenCart} className='relative cursor-pointer transition-all hover:opacity-80'>
      <Image src={cart} alt='cart' width={24} height={24} className='h-5 w-5 md:h-6 md:w-6' />
      {totalCartItems > 0 && (
        <div className='text-background bg-primary md:text-md absolute -top-2 -right-2 flex h-4 w-fit min-w-4 items-center justify-center rounded-full px-1 text-sm font-bold sm:h-5 sm:min-w-5 md:-top-2.5 md:-right-2.5 md:h-5 md:min-w-5'>
          {totalCartItems}
        </div>
      )}
    </div>
  )
}

export default Cart
