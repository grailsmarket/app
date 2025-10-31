import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { hasRegistrationPrice } from '@/utils/listStatus'
import { formatRegisterPrice } from '@/utils/formatPremiumPrice'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import useETHPrice from '@/hooks/useETHPrice'

interface RegistryPriceProps {
  domain: MarketplaceDomainType
  columnCount: number
}

const RegistryPrice: React.FC<RegistryPriceProps> = ({ domain, columnCount }) => {
  const { ethPrice } = useETHPrice()

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['registry_price'].getWidth(columnCount))}>
      <div className='flex flex-col'>
        <div className='flex text-xs leading-[18px] font-medium'>
          {hasRegistrationPrice(domain.expiry_date) && (
            <>
              <p className='text-light-600 opacity-60'>$</p>
              <p className='text-light-600 ml-1'>
                {formatRegisterPrice(calculateRegistrationPrice(domain.name, ethPrice ?? 4000).usd)}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegistryPrice
