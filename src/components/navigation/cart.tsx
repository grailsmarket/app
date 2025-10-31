import React from 'react'
import Image from 'next/image'
import cart from 'public/icons/cart.svg'
import { useUserContext } from '@/context/user'

const Cart = () => {
  const { setIsCartOpen } = useUserContext()

  const handleOpenCart = () => {
    setIsCartOpen(true)
  }

  return (
    <div onClick={handleOpenCart} className='cursor-pointer transition-all hover:opacity-80'>
      <Image src={cart} alt='cart' width={24} height={24} />
    </div>
  )
}

export default Cart
