import React, { useEffect, useState } from 'react'
import { cn } from '@/utils/tailwind'
import { useUserContext } from '@/context/user'
import { Cross } from 'ethereum-identity-kit'
import useCartDomains from '@/hooks/useCartDomains'
import DomainItem from './components/domainItem'
import { usePathname } from 'next/navigation'
import NoResults from '../ui/noResults'
import SecondaryButton from '../ui/buttons/secondary'
import Label from '../ui/label'

const Cart = () => {
  const pathname = usePathname()
  const { isCartOpen, setIsCartOpen } = useUserContext()
  const { purchaseDomains, registerDomains, offerDomains, cartIsEmpty, clearCart } = useCartDomains()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isCartOpen) {
      setIsVisible(true)
      setTimeout(() => setIsAnimating(true), 10)
    } else {
      setIsAnimating(false)
      setTimeout(() => setIsVisible(false), 300)
    }
  }, [isCartOpen])

  useEffect(() => {
    setIsCartOpen(false)
  }, [pathname, setIsCartOpen])

  const registerDomainsEmpty = registerDomains.length === 0
  const registeredDomainsEmpty = purchaseDomains.length === 0
  const offerDomainsEmpty = offerDomains.length === 0

  return (
    <div
      onClick={() => setIsCartOpen(false)}
      className={cn(
        'fixed top-0 right-0 z-50 h-full w-full justify-end transition-all duration-300',
        isVisible ? 'flex' : 'hidden',
        isAnimating ? 'bg-black/50' : 'bg-black/0'
      )}
    >
      <div
        className={cn(
          'bg-background border-primary p-lg md:p-2xl relative flex h-full w-full flex-col gap-10 transition-transform duration-300 md:max-w-2xl md:border-l-2',
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col gap-10 overflow-y-scroll pb-16'>
          <div className='flex flex-row items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h2 className='font-sedan-sc text-3xl'>Cart</h2>
              <Label label={purchaseDomains.length + registerDomains.length + offerDomains.length} />
            </div>
            <Cross className='h-5 w-5 cursor-pointer hover:opacity-80' onClick={() => setIsCartOpen(false)} />
          </div>
          {!registeredDomainsEmpty && (
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <h3 className='font-sedan-sc text-2xl'>Purchase</h3>
                <Label label={purchaseDomains.length} />
              </div>
              <div className='flex flex-col gap-4'>
                {purchaseDomains.map((domain) => (
                  <DomainItem key={domain.name} domain={domain} />
                ))}
              </div>
            </div>
          )}
          {!registerDomainsEmpty && (
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <h3 className='font-sedan-sc text-2xl'>Register</h3>
                <Label label={registerDomains.length} />
              </div>
              <div className='flex flex-col gap-4'>
                {registerDomains.map((domain) => (
                  <DomainItem key={domain.name} domain={domain} />
                ))}
              </div>
            </div>
          )}
          {!offerDomainsEmpty && (
            <div className='flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <h3 className='font-sedan-sc text-2xl'>Offer</h3>
                <Label label={offerDomains.length} />
              </div>
              <div className='flex flex-col gap-4'>
                {offerDomains.map((domain) => (
                  <DomainItem key={domain.name} domain={domain} />
                ))}
              </div>
            </div>
          )}
        </div>
        {cartIsEmpty && (
          <div className='flex h-[70vh] flex-col'>
            <NoResults label='No Grails in your cart' />
          </div>
        )}
        <div className='border-primary bg-background p-lg absolute right-0 bottom-0 z-20 flex w-full flex-row justify-end rounded-b-lg border-t-2 lg:justify-between'>
          <div className='flex w-fit flex-row gap-x-2'>
            <SecondaryButton onClick={clearCart} disabled={cartIsEmpty}>
              Clear Cart
            </SecondaryButton>
            <SecondaryButton onClick={() => setIsCartOpen(false)}>Close Cart</SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
