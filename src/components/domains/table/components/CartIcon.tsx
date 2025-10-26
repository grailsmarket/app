import React from 'react'
import Image from 'next/image'
import useCartDomains from '@/hooks/useCartDomains'
import inCart from 'public/icons/cart-added.svg'
import addToCart from 'public/icons/cart-add.svg'
import { cn } from '@/utils/tailwind'

interface CartIconProps {
  name: string
  size?: string | number
  className?: string
}

const CartIcon: React.FC<CartIconProps> = ({ name, size, className }) => {
  const { isAddedToCart } = useCartDomains()

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[4px] p-1.5',
        isAddedToCart(name) ? 'opacity-100 hover:opacity-80' : 'opacity-70 hover:opacity-100',
        'transition-opacity',
        className
      )}
    >
      <Image
        src={isAddedToCart(name) ? inCart : addToCart}
        alt='Add to cart'
        style={size ? { width: size, height: size } : {}}
      />
    </div>
  )
}

export default CartIcon
