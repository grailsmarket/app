import { MarketplaceDomainType } from '@/app/types/domains'

export const generateOpacity = (
  hoverName: string | null,
  selectedDomain: MarketplaceDomainType | null,
  name: string,
) => {
  if (
    selectedDomain?.name === name ||
    hoverName === name ||
    (hoverName === null && selectedDomain?.name === null)
  )
    return '1'

  return '0.7'
}
