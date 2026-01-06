import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useFilterRouter } from './useFilterRouter'

export const useContentWidth = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return {
    contentWidth: getContentWidth(),
    filtersOpen,
    isMobile: windowWidth ? windowWidth < 1024 : false,
  }
}
