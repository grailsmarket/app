import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import SaleAsset from '@/components/ui/asset'
import { formatRegisterPrice } from '@/utils/formatPremiumPrice'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'

interface LastSaleProps {
  domain: MarketplaceDomainType
  columnCount: number
}


// Last price of the domain (shows last sale if present, otherwise we fall back on the registration price)
const LastSale: React.FC<LastSaleProps> = ({ domain, columnCount }) => {
  const lastPrice =
    domain.last_sale_price && domain.last_sale_asset
      ? {
        ETH: formatEtherPrice(domain.last_sale_price),
        USDC: formatRegisterPrice(parseFloat(domain.last_sale_price)),
        DAI: formatRegisterPrice(parseFloat(domain.last_sale_price)),
      }[domain.last_sale_asset]
      : calculateRegistrationPrice(domain.name).usd
        ? formatRegisterPrice(calculateRegistrationPrice(domain.name).usd)
        : null


  const lastPriceAsset = domain.last_sale_asset || 'USDC'

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['last_sale'].getWidth(columnCount))}>
      <div className={`flex items-center ${lastPriceAsset === 'USDC' ? 'gap-[2px]' : 'gap-1'}`}>
        {lastPrice && lastPriceAsset && <SaleAsset asset={lastPriceAsset} fontSize='text-xs' ethSize='13px' />}
        <p className='text-light-600 text-xs font-medium'>{lastPrice}</p>
      </div>
    </div>
  )
}

export default LastSale
