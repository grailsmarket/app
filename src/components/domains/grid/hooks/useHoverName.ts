import { MarketplaceDomainNameType } from '@/state/reducers/domains/marketplaceDomains'
import { useState } from 'react'

export const useHoverName = () => {
  const [hoverName, setHoverName] = useState<MarketplaceDomainNameType | null>(null)

  const generateOnEnter = (name: MarketplaceDomainNameType) => {
    return () => {
      setHoverName(name)
    }
  }

  const resetHoverName = () => {
    setHoverName(null)
  }

  return { hoverName, generateOnEnter, resetHoverName }
}
