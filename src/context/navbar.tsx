'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

interface NavbarContextType {
  isNavbarVisible: boolean
  setNavbarVisible: (visible: boolean) => void
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined)

export const NavbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)

  const setNavbarVisible = useCallback((visible: boolean) => {
    setIsNavbarVisible(visible)
  }, [])

  const value = useMemo(
    () => ({
      isNavbarVisible,
      setNavbarVisible,
    }),
    [isNavbarVisible, setNavbarVisible]
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
