'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useVirtualKeyboardOpen } from '@/hooks/useVirtualKeyboardOpen'

interface NavbarContextType {
  isNavbarVisible: boolean
  setNavbarVisible: (visible: boolean) => void
  hideWhenKeyboardOpen: boolean
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined)

export const NavbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const hideWhenKeyboardOpen = useVirtualKeyboardOpen()

  const setNavbarVisible = useCallback((visible: boolean) => {
    setIsNavbarVisible(visible)
  }, [])

  const value = useMemo(
    () => ({
      isNavbarVisible,
      setNavbarVisible,
      hideWhenKeyboardOpen,
    }),
    [isNavbarVisible, setNavbarVisible, hideWhenKeyboardOpen]
  )

  return <NavbarContext.Provider value={value}>{children}</NavbarContext.Provider>
}

export const useNavbar = () => {
  const context = useContext(NavbarContext)
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider')
  }
  return context
}
