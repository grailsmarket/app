import React from 'react'
import { cn } from '@/utils/tailwind'
import PriceComponent from '@/components/ui/price'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { DomainListingType, RegistrationStatus } from '@/types/domains'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import useETHPrice from '@/hooks/useETHPrice'
import { PREMIUM, REGISTERABLE_STATUSES, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { formatTimeLeft } from '@/utils/time/formatTimeLeft'

interface PriceProps {
  name: string
  expiry_date: string | null
  listing: DomainListingType
  registrationStatus: RegistrationStatus
  columnCount: number
  index: number
}

const Price: React.FC<PriceProps> = ({ name, expiry_date, listing, registrationStatus, columnCount, index }) => {
  const { ethPrice } = useETHPrice()

  if (REGISTERABLE_STATUSES.includes(registrationStatus)) {
    const premiumPriceOracle = expiry_date ? new PremiumPriceOracle(new Date(expiry_date).getTime() / 1000) : null
    const premiumPrice = premiumPriceOracle
      ? premiumPriceOracle.getOptimalPrecisionPremiumAmount(new Date().getTime() / 1000)
      : 0
    const regPrice = calculateRegistrationPrice(name, ethPrice)

    return (
      <div className={cn(ALL_MARKETPLACE_COLUMNS['price'].getWidth(columnCount), 'text-md flex flex-col gap-px')}>
        <div>
          <p
            className={cn(
              'flex items-center gap-px font-semibold',
              registrationStatus === PREMIUM ? 'text-premium' : 'text-available'
            )}
          >
            {registrationStatus === PREMIUM ? (
              <>
                <p>$</p>
                <p>{premiumPrice.toLocaleString(navigator.language, { maximumFractionDigits: 2 })}</p>
                <p>+</p>
                <p className='text-md text-neutral font-medium'>
                  ${regPrice.usd.toLocaleString(navigator.language, { maximumFractionDigits: 0 })}/Year
                </p>
              </>
            ) : (
              <>
                <p>$</p>
                <p>{regPrice.usd.toLocaleString(navigator.language, { maximumFractionDigits: 0 })}</p>
                <p className='text-neutral font-medium'>&nbsp;/&nbsp;Year</p>
              </>
            )}
          </p>
        </div>
        {registrationStatus === PREMIUM && expiry_date && (
          <p className='text-md text-premium/70 font-medium'>Premium ({formatTimeLeft(expiry_date, 'premium')})</p>
        )}
        {registrationStatus === UNREGISTERED && <p className='text-md text-available font-medium'>Available</p>}
      </div>
    )
  }

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['price'].getWidth(columnCount), 'text-md flex flex-col gap-px')}>
      {listing && (
        <>
          <PriceComponent
            // @ts-expect-error - price_wei is a type from the watchlist
            price={listing.price || listing.price_wei}
            currencyAddress={listing.currency_address}
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
            iconSize='16px'
          />
          {listing.expires_at && (
            <p className='text-md text-neutral'>
              <span className='xs:inline hidden'>Ends</span>{' '}
              {formatExpiryDate(listing.expires_at, { includeTime: false, dateDivider: '/' })}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default Price
