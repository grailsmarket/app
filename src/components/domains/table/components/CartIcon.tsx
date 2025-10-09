import React, { useState } from 'react'
import Image from 'next/image'
import useCartDomains from '@/app/hooks/useCartDomains'
import inCart from '@/public/svg/domains/inCart.svg'
import addToCart from '@/public/svg/domains/addToCart.svg'
import addToCartHovered from '@/public/svg/domains/addToCart-purple.svg'

interface CartIconProps {
  name: string
  size?: string | number
}

const CartIcon: React.FC<CartIconProps> = ({ name, size }) => {
  const [hovered, setHovered] = useState(false)
  const { isAddedToCart } = useCartDomains()

  return (
    <div
      className={`ph-no-capture flex items-center justify-center rounded-[4px] p-1.5 ${
        hovered && !addToCart ? 'bg-white' : 'bg-purple'
      } ${
        isAddedToCart(name)
          ? ' bg-opacity-20'
          : hovered
          ? 'bg-opacity-5'
          : 'bg-opacity-0'
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Image
        src={
          isAddedToCart(name) ? inCart : hovered ? addToCartHovered : addToCart
        }
        alt="Add to cart"
        style={size ? { width: size, height: size } : {}}
      />
    </div>
  )
}

export default CartIcon
