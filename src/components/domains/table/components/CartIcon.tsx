import React from 'react'
import Image from 'next/image'
import useCartDomains from '@/hooks/useCartDomains'
import inCart from 'public/icons/cart-added.svg'
import addToCart from 'public/icons/cart-add.svg'
import { cn } from '@/utils/tailwind'
import { MarketplaceDomainType } from '@/types/domains'

interface CartIconProps {
  domain?: MarketplaceDomainType
  size?: string | number
  className?: string
  hasBorder?: boolean
}

const CartIcon: React.FC<CartIconProps> = ({ domain, size, className, hasBorder = false }) => {
  const { isAddedToCart: isAddedToCartDomains } = useCartDomains()
  const isAddedToCart = domain ? isAddedToCartDomains(domain.token_id) : false

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[4px] p-1.5 transition-all',
        isAddedToCart ? 'opacity-100 hover:opacity-80' : 'opacity-70 hover:opacity-100',
        hasBorder && 'border-foreground/50 hover:border-foreground/80 rounded-sm border-2',
        hasBorder && isAddedToCart && 'border-primary hover:border-primary',
        className
      )}
    >
      <Image
        src={isAddedToCart ? inCart : addToCart}
        alt='Add to cart'
        style={size ? { width: size, height: size } : {}}
      />
    </div>
  )
}

export default CartIcon
