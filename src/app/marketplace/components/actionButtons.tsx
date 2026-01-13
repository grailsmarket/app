'use client'

import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import useCartDomains from '@/hooks/useCartDomains'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import ArrowDown from 'public/icons/arrow-down.svg'
import { useFilterContext } from '@/context/filters'

interface ActionButtonsProps {
  hideDomainActions?: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ hideDomainActions }) => {
  const { filterType, categoryTab } = useFilterContext()
  const { setIsCartOpen } = useUserContext()
  const { clearCart, cartIsEmpty } = useCartDomains()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isActionBarVisible = !(cartIsEmpty || hideDomainActions)
  const isBulkSelectVisible = filterType === 'category' && categoryTab?.value !== 'activity'

  return (
    <>
      <button
        onClick={scrollToTop}
        className={cn(
          'bg-secondary hover:bg-tertiary border-tertiary fixed right-2 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm transition-all duration-300 md:right-4',
          showScrollTop ? 'opacity-100' : 'pointer-events-none opacity-0',
          isActionBarVisible ? 'bottom-16 md:bottom-18' : 'bottom-4 md:bottom-6',
          (isBulkSelectVisible && isActionBarVisible) && 'hidden',
        )}
        aria-label='Scroll to top'
      >
        <Image src={ArrowDown} alt='Scroll to top' width={14} height={14} className='rotate-180' />
      </button>

      <div
        className={cn(
          'border-tertiary action-buttons-container bg-background fixed bottom-0 left-0 z-20 flex h-14 w-full flex-row items-center justify-end rounded-b-lg border-t-2 transition-all duration-300 md:h-16 starting:translate-y-full',
          !cartIsEmpty && !hideDomainActions ? 'translate-y-0' : 'hidden'
        )}
      >
        {!cartIsEmpty && !hideDomainActions && (
          <div className='px-md md:px-lg flex w-fit flex-row gap-x-2'>
            <SecondaryButton onClick={clearCart} disabled={cartIsEmpty}>
              Clear Cart
            </SecondaryButton>
            <PrimaryButton onClick={() => setIsCartOpen(true)}>Open Cart</PrimaryButton>
          </div>
        )}
      </div>
    </>
  )
}

export default ActionButtons
