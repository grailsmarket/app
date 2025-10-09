import React from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'

import useCartDomains from '@/app/hooks/useCartDomains'
import { useSelectedDomain } from '@/app/hooks/useSelectedDomain'
import useETHPrice from '../../Footer/components/ETHPrice/hooks/useETHPrice'

import { MarketplaceDomainType } from '@/app/types/domains'
import { hasRegistrationPrice } from '@/app/utils/listStatus'
import { formatEtherPrice } from '@/app/utils/formatEtherPrice'
import { checkNameValidity } from '@/app/utils/checkNameValidity'
import { formatRegisterPrice } from '@/app/utils/formatPremiumPrice'
import { getRegistrationStatus } from '@/app/utils/getRegistrationStatus'

import Like from '../../Like'
import CartIcon from './CartIcon'
import Tooltip from '../../Tooltip'
import SaleAsset from '../../SaleAsset'
import CategoriesTooltip from '../../CategoriesTooltip'

import { MarketplaceDomainNameType } from '@/app/state/reducers/domains/marketplaceDomains'

import {
  PREMIUM,
  REGISTERED,
  GRACE_PERIOD,
} from '@/app/constants/domains/registrationStatuses'
import { USDTokens } from '@/app/constants/web3/tokens'

import ethGray from '@/public/svg/crypto/eth-gray.svg'
import clock from '@/public/svg/domains/clock-purple.svg'

interface TableRowProps {
  domain: MarketplaceDomainType
  index: number
  showLimitedDetails?: boolean
  headerDisplayStyle: string[]
}

const TableRow: React.FC<TableRowProps> = ({
  domain,
  index,
  showLimitedDetails,
  headerDisplayStyle,
}) => {
  const { address } = useAccount()
  const { ethPrice } = useETHPrice()
  const { onSelect, isAddedToCart } = useCartDomains()
  const { generateOnClick, selectedDomain } = useSelectedDomain()

  const isSelectedOrAddedToCart = (name: MarketplaceDomainNameType) => {
    return selectedDomain?.name === name || isAddedToCart(name)
  }

  const domainIsValid = checkNameValidity(domain.name_ens)
  const registrationStatus = getRegistrationStatus(domain.expire_time)
  const cantAddToCart =
    registrationStatus === GRACE_PERIOD ||
    address?.toLowerCase() === domain.owner?.toLowerCase()

  const lastPrice =
    domain.last_price && domain.last_sale_asset
      ? {
          ETH: showLimitedDetails
            ? formatRegisterPrice(
                Number(formatEtherPrice(domain.last_price, true)) *
                  Number(ethPrice || 1),
              )
            : formatEtherPrice(domain.last_price),
          USDC: formatRegisterPrice(parseFloat(domain.last_price)),
          DAI: formatRegisterPrice(parseFloat(domain.last_price)),
        }[domain.last_sale_asset]
      : domain.premium_reg_price
      ? formatRegisterPrice(parseFloat(domain.premium_reg_price))
      : null
  const lastPriceAsset = showLimitedDetails
    ? 'USDC'
    : domain.last_sale_asset || (domain.premium_reg_price ? 'USDC' : null)

  return (
    <div
      className={`ph-no-capture group flex h-[60px] w-full cursor-pointer items-center border-b border-b-dark-900 py-3 pl-4 pr-[14px] transition ${
        selectedDomain?.name === domain.name
          ? 'bg-dark-400'
          : 'bg-dark-700 hover:bg-dark-300'
      }`}
      onClick={generateOnClick(domain)}
    >
      <div className={headerDisplayStyle[0]}>
        <div className="flex h-[36px] flex-col justify-center">
          <div className="flex w-full flex-row items-center justify-start gap-2 lg:w-[13vw]">
            {registrationStatus === GRACE_PERIOD && (
              <Image src={clock} alt="icon" className="w-[18px]" />
            )}
            {registrationStatus !== GRACE_PERIOD && (
              <CategoriesTooltip domain={domain} />
            )}
            <p
              className={`truncate text-xs font-bold leading-[18px] ${
                registrationStatus === PREMIUM
                  ? 'text-purple'
                  : 'text-light-100'
              }`}
            >
              {domain.name}
            </p>
            {!domainIsValid && (
              <Tooltip
                position="right"
                label="Name contains invalid character(s)"
                align="center"
              >
                <p className="pl-2 text-xs">⚠️</p>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      <div className={headerDisplayStyle[1]}>
        <div className="flex">
          {registrationStatus === REGISTERED && domain.listing_price && (
            <Image src={ethGray} alt="ETH" className="h-[14px] w-auto" />
          )}
          <p className="ml-1 truncate text-xs font-medium text-light-600">
            {registrationStatus === REGISTERED &&
              domain.listing_price &&
              formatEtherPrice(domain.listing_price)}
          </p>
        </div>
      </div>
      <div
        className={headerDisplayStyle[2]}
        style={{
          width: showLimitedDetails ? '25.65%' : undefined,
        }}
      >
        <div className="flex flex-col">
          <div className="flex text-xs font-medium leading-[18px]">
            {hasRegistrationPrice(domain.expire_time || 0) && (
              <>
                <p className="text-light-600 opacity-60">$</p>
                <p className="ml-1 text-light-600">
                  {formatRegisterPrice(domain.registration_price || 0)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
      <div
        className={headerDisplayStyle[3]}
        style={{
          width: showLimitedDetails ? '25.65%' : undefined,
        }}
      >
        <div
          className={`flex items-center ${
            USDTokens.includes(domain.last_sale_asset || '')
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
      <div className={headerDisplayStyle[4]}>
        {domain.highest_offer && (
          <div className="flex">
            <Image src={ethGray} alt="ETH" className="h-[14px] w-auto" />
            <p className="ml-1 text-xs font-medium text-light-600">
              {formatEtherPrice(domain.highest_offer || '0') || null}
            </p>
          </div>
        )}
      </div>
      <div
        className={`${headerDisplayStyle[5]} flex min-w-[30px] flex-row justify-end`}
      >
        <div className="flex items-center lg:gap-x-3">
          <div className="hidden lg:block">
            <Like
              domain={domain}
              tooltipPosition={index === 0 ? 'bottom' : 'top'}
            />
          </div>
          <button
            className={`ph-no-capture rounded-sm p-1.5 ${
              isSelectedOrAddedToCart(domain.name)
                ? 'opacity-100'
                : !cantAddToCart
                ? 'opacity-100 group-hover:opacity-100 lg:opacity-0'
                : 'opacity-0'
            }`}
            disabled={cantAddToCart}
            onClick={(e) => onSelect(e, domain)}
          >
            <CartIcon name={domain.name} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TableRow
