import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import SaleAsset from '@/components/ui/asset'
import { formatRegisterPrice } from '@/utils/formatPremiumPrice'
import { formatEtherPrice } from '@/utils/formatEtherPrice'

interface LastSaleProps {
  domain: MarketplaceDomainType
  columnCount: number
}

const LastSale: React.FC<LastSaleProps> = ({ domain, columnCount }) => {
  const lastPrice =
    domain.last_price && domain.last_sale_asset
      ? {
        ETH: formatEtherPrice(domain.last_price),
        USDC: formatRegisterPrice(parseFloat(domain.last_price)),
        DAI: formatRegisterPrice(parseFloat(domain.last_price)),
      }[domain.last_sale_asset]
      : domain.premium_reg_price
        ? formatRegisterPrice(parseFloat(domain.premium_reg_price))
        : null
  const lastPriceAsset = domain.last_sale_asset

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['last_sale'].getWidth(columnCount))}>
      <div
        className={`flex items-center ${lastPriceAsset === 'USDC'
          ? 'gap-[2px]'
          : 'gap-1'
          }`}
      >
        {lastPrice && lastPriceAsset && (
          <SaleAsset
            asset={lastPriceAsset}
            fontSize="text-xs"
            ethSize="13px"
          />
        )}
        <p className="text-xs font-medium text-light-600">{lastPrice}</p>
      </div>
    </div>
  )
}

export default LastSale
