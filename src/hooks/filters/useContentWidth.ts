import { useIsClient } from 'ethereum-identity-kit'
import { useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useFilterRouter } from './useFilterRouter'

export const useContentWidth = () => {
  const isClient = useIsClient()
  const { width: responsiveWidth } = useResponsiveSize()
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  const getContentWidth = () => {
    if (!isClient || !responsiveWidth) return '100%'
    if (responsiveWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return {
    contentWidth: getContentWidth(),
    filtersOpen,
    isMobile: responsiveWidth ? responsiveWidth < 1024 : false,
  }
}
