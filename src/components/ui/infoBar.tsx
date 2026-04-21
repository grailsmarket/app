'use client'

import { useEffect, useState } from 'react'
import { Cross } from 'ethereum-identity-kit'

const INFO_BAR_STORAGE_KEY = 'grails-info-bar-april'

const InfoBar: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const dismissed = localStorage.getItem(INFO_BAR_STORAGE_KEY)
    const shouldShow = dismissed !== 'true'
    setIsVisible(shouldShow)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(INFO_BAR_STORAGE_KEY, 'true')
    setIsVisible(false)
  }

  // Don't render anything until mounted to avoid hydration mismatch
  if (!hasMounted || !isVisible) {
    return null
  }

  return (
    <div className='bg-primary xs:text-md text-background p-sm z-[1000000] flex w-full items-center justify-center pr-6 text-sm font-bold'>
      <p>
        👕 Grails Merch Giveaway: Extend & Register to enter!&nbsp;
        <a
          href='https://x.com/BrantlyMillegan/status/2039691200895021380'
          target='_blank'
          rel='noreferrer'
          className='text-background underline hover:opacity-70'
        >
          Details
        </a>
      </p>
      <button
        onClick={handleDismiss}
        className='text-background absolute top-0 right-0 cursor-pointer p-1.5 hover:opacity-70 sm:p-2'
      >
        <Cross className='h-3 w-3' />
      </button>
    </div>
  )
}

export default InfoBar
