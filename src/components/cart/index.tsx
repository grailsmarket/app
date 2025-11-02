import React, { useEffect } from 'react'
import { cn } from '@/utils/tailwind'
import { useUserContext } from '@/context/user'
import { Cross } from 'ethereum-identity-kit'
import useCartDomains from '@/hooks/useCartDomains'
import DomainItem from './components/domainItem'
import { usePathname } from 'next/navigation'
import NoResults from '../ui/noResults'

const Cart = () => {
  const pathname = usePathname()
  const { isCartOpen, setIsCartOpen } = useUserContext()
  const { purchaseDomains, registerDomains, offerDomains, cartIsEmpty } = useCartDomains()

  useEffect(() => {
    setIsCartOpen(false)
  }, [pathname, setIsCartOpen])

  const registerDomainsEmpty = registerDomains.length === 0
  const registeredDomainsEmpty = purchaseDomains.length === 0
  const offerDomainsEmpty = offerDomains.length === 0

  return (
    <div
      onClick={() => setIsCartOpen(false)}
      className={cn('fixed top-0 right-0 z-50 h-full w-full justify-end bg-black/50', isCartOpen ? 'flex' : 'hidden')}
    >
      <div
        className='bg-background border-primary p-2xl flex h-full w-1/2 max-w-2xl flex-col gap-10 rounded-tl-lg rounded-bl-lg border-l-2 transition-all duration-300 starting:translate-x-full'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex flex-col gap-10'>
          <div className='flex flex-row items-center justify-between'>
            <h2 className='font-sedan-sc text-3xl'>Cart</h2>
            <Cross className='h-5 w-5 cursor-pointer hover:opacity-80' onClick={() => setIsCartOpen(false)} />
          </div>
          {!registeredDomainsEmpty && (
            <div className='flex flex-col gap-4'>
              <h3 className='font-sedan-sc text-2xl'>Purchase</h3>
              <div className='flex flex-col gap-4'>
                {purchaseDomains.map((domain) => (
                  <DomainItem key={domain.name} domain={domain} />
                ))}
              </div>
            </div>
          )}
          {!registerDomainsEmpty && (
            <div className='flex flex-col gap-4'>
              <h3 className='font-sedan-sc text-2xl'>Register</h3>
              <div className='flex flex-col gap-4'>
                {registerDomains.map((domain) => (
                  <DomainItem key={domain.name} domain={domain} />
                ))}
              </div>
            </div>
          )}
          {!offerDomainsEmpty && (
            <div className='flex flex-col gap-4'>
              <h3 className='font-sedan-sc text-2xl'>Offer</h3>
              <div className='flex flex-col gap-4'>
                {offerDomains.map((domain) => (
                  <DomainItem key={domain.name} domain={domain} />
                ))}
              </div>
            </div>
          )}
        </div>
        {cartIsEmpty && (
          <div className='flex h-[90vh] flex-col'>
            <NoResults label='No Grails in your cart' />
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
