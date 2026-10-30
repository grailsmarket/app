'use client'

import useCartDomains from '@/hooks/useCartDomains'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import ArrowDown from 'public/icons/arrow-down.svg'
import { useFilterContext } from '@/context/filters'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'

interface ActionButtonsProps {
  hideDomainActions?: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ hideDomainActions }) => {
  const { filterType, categoryTab } = useFilterContext()
  const { selectedTab: marketplaceTab } = useAppSelector(selectMarketplace)
  const { cartIsEmpty } = useCartDomains()
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

  const activeTab = filterType === 'category' ? categoryTab : marketplaceTab
  const isBulkSelectVisible = activeTab?.value !== 'activity'
  const isActionBarVisible = !hideDomainActions && isBulkSelectVisible

  return (
    <>
      <button
        onClick={scrollToTop}
        className={cn(
          'bg-secondary hover:bg-tertiary border-tertiary fixed right-[calc(var(--chat-sidebar-width,0)+0.5rem)] z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm transition-all duration-300 @[48rem]/app:right-[calc(var(--chat-sidebar-width,0)+1rem)] @[80rem]/app:right-[calc(var(--chat-sidebar-width,0)+1.25rem)]',
          showScrollTop ? 'opacity-100' : 'pointer-events-none opacity-0',
          isActionBarVisible
            ? 'bottom-16 @[48rem]/app:bottom-18'
            : 'bottom-4 @[48rem]/app:bottom-5',
        )}
        aria-label='Scroll to top'
      >
        <Image src={ArrowDown} alt='Scroll to top' width={14} height={14} className='rotate-180' />
      </button>
    </>
  )
}

export default ActionButtons
