import React from 'react'
import Image from 'next/image'
import cart from 'public/icons/cart.svg'

const Cart = () => {
  return (
    <div>
      <Image src={cart} alt='cart' width={24} height={24} />
    </div>
  )
}

export default Cart
