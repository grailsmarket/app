'use client'

import { useWindowSize } from 'ethereum-identity-kit'
import { useAppContainerWidth } from './useAppContainerWidth'

export const useResponsiveSize = () => {
  const { width: windowWidth, height } = useWindowSize()
  const appContainerWidth = useAppContainerWidth()

  return {
    width: appContainerWidth ?? windowWidth,
    height,
    windowWidth,
    appContainerWidth,
  }
}
