import React from 'react'
import Image from 'next/image'
import useCartDomains from '@/hooks/useCartDomains'
import inCart from 'public/icons/cart-added.svg'
import addToCart from 'public/icons/cart-add.svg'

interface CartIconProps {
  name: string
  size?: string | number
}

const CartIcon: React.FC<CartIconProps> = ({ name, size }) => {
  const { isAddedToCart } = useCartDomains()

  return (
    <div
      className={` flex items-center justify-center rounded-[4px] p-1.5 ${!addToCart ? 'bg-white' : 'bg-purple'}`}
    >
      <Image
        src={
          isAddedToCart(name) ? inCart : addToCart
        }
        alt="Add to cart"
        style={size ? { width: size, height: size } : {}}
      />
    </div>
  )
}

export default CartIcon
