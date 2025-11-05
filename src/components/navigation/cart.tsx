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
      <Image src={cart} alt='cart' width={24} height={24} />
      {totalCartItems > 0 && (
        <div className='text-background bg-primary text-md absolute -top-2.5 -right-2.5 flex h-5 w-fit min-w-5 items-center justify-center rounded-full px-1 font-bold sm:h-5 sm:min-w-5'>
          {totalCartItems}
        </div>
      )}
    </div>
  )
}

export default Cart
