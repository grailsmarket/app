import React from 'react'
import Image from 'next/image'
import useCartDomains from '@/hooks/useCartDomains'
import inCart from 'public/icons/cart-added.svg'
import addToCart from 'public/icons/cart-add.svg'
import { cn } from '@/utils/tailwind'
import { MarketplaceDomainType } from '@/types/domains'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'

interface CartIconProps {
  domain?: MarketplaceDomainType
  size?: string | number
  className?: string
  hasBorder?: boolean
}

const CartIcon: React.FC<CartIconProps> = ({ domain, size = '18px', className, hasBorder = false }) => {
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const { isAddedToCart: isAddedToCartDomains, isModifyingDomain, isCartDomainsLoading, onSelect } = useCartDomains()
  const isAddedToCart = domain ? isAddedToCartDomains(domain.token_id) : false
  const isDomainModifying = domain ? isModifyingDomain(domain.token_id) : false

  const isBeingRemoved = isDomainModifying && isAddedToCart
  const isBeingAdded = isDomainModifying && !isAddedToCart
  const showInCart = (isAddedToCart || isBeingAdded) && !isBeingRemoved

  return (
    <div
      className={cn(
        'flex min-h-7 min-w-7 items-center justify-center rounded-[4px] transition-all sm:p-1.5',
        showInCart ? 'opacity-100 hover:opacity-80' : 'opacity-70 hover:opacity-100',
        hasBorder && 'border-foreground/50 hover:border-foreground/80 rounded-sm border-2',
        hasBorder && showInCart && 'border-primary hover:border-primary',
        isCartDomainsLoading && 'opacity-40',
        className
      )}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()

        if (!userAddress) return openConnectModal?.()
        if (domain) {
          onSelect(e, domain)
        }
      }}
    >
      <Image
        src={showInCart ? inCart : addToCart}
        alt='Add to cart'
        style={size ? { width: size, height: size, minWidth: size, minHeight: size } : {}}
      />
    </div>
  )
}

export default CartIcon
