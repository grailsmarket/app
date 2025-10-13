import React from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

import useCartDomains from '@/hooks/useCartDomains'
import { generateGradient } from '../utils/generateGradient'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'
import SaleAsset from '@/components/ui/asset'
import CartIcon from '../../table/components/CartIcon'
import Watchlist from '@/components/ui/watchlist'
import { MarketplaceDomainType } from '@/types/domains'
import {
  REGISTERED,
  GRACE_PERIOD,
  REGISTERABLE_STATUSES,
} from '@/constants/domains/registrationStatuses'
import ens from '@/public/svg/crypto/ens.svg'

interface CardProps {
  domain: MarketplaceDomainType
}

const Card: React.FC<CardProps> = ({ domain }) => {
  const { onSelect } = useCartDomains()
  const { address } = useAccount()

  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart =
    registrationStatus === GRACE_PERIOD ||
    address?.toLowerCase() === domain.owner?.toLowerCase()
  const domainFontSize = Math.floor((1 / domain.name.length) * 290)

  return (
    <div
      className={`opacity-70 group flex flex-1 cursor-pointer bg-secondary flex-col gap-y-px transition hover:opacity-100`}
    >
      <div
        className={`${generateGradient(
          domain.expiry_date || 0,
        )} flex h-[170px] w-full flex-col justify-between p-[21px]`}
      >
        <Image src={ens} alt="ENS symbol" />
        <div className="flex flex-row items-center justify-start">
          <h5
            style={{
              textShadow: '0px 0px 4px rgba(0, 0, 0, 0.15)',
            }}
            className={`overflow-y-visible truncate text-[${domainFontSize > 21 ? 21 : domainFontSize
              }px] font-bold leading-[120%] text-white`}
          >
            {domain.name}
          </h5>
          {!domainIsValid && (
            <Tooltip
              position="top"
              label="Name contains invalid character(s)"
              align="left"
            >
              <p className="pl-[6px]">⚠️</p>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="flex w-full flex-1 flex-col justify-between gap-1 ">
        <div className="flex w-full flex-col pl-4 pt-4 ">
          {registrationStatus !== GRACE_PERIOD &&
            (registrationStatus === REGISTERED ? (
              domain.price ? (
                <div className="flex items-center gap-1">
                  <SaleAsset asset="ETH" ethSize="12px" />
                  <p className="truncate text-xs font-bold leading-[18px]  text-light-100">
                    {domain.price &&
                      formatEther(BigInt(domain.price))}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-bold leading-[18px] text-light-150">
                  Unlisted
                </p>
              )
            ) : (
              <div className="flex items-center gap-1">
                <SaleAsset asset="USDC" fontSize="text-xs" />
                <p
                  className={
                    'truncate text-xs font-bold leading-[18px] text-light-100'
                  }
                >
                  {domain.registration_price?.toLocaleString(
                    navigator.language,
                    {
                      maximumFractionDigits: 0,
                    },
                  )}
                </p>
              </div>
            ))}
          {domain.last_price ? (
            <div className="flex items-center gap-[6px]">
              <p className="truncate text-xs font-medium leading-[18px] text-light-400">
                Last sale:
              </p>
              <div className="flex items-center gap-1">
                <SaleAsset
                  asset={domain.last_sale_asset || 'ETH'}
                  ethSize="11px"
                  fontSize="text-xs"
                />
                <p className="text-xs text-light-150">
                  {domain.last_price
                    ? formatEtherPrice(domain.last_price)
                    : null}
                </p>
              </div>
            </div>
          ) : (
            <p className="min-w-px h-[18px] truncate text-xs font-medium leading-[18px] text-light-400">
              {/* {domain.taxonomies?.map((tax: string, index: number) =>
                index + 1 === domain.taxonomies?.length ? tax : tax + ', ',
              ) || registrationStatus} */}
            </p>
          )}
        </div>
        <div className="flex justify-between p-2 pl-4 pt-0">
          <button
            disabled={canAddToCart}
          // onClick={(e) => onCheckout(e, domain)}
          >
            {!canAddToCart && (
              <p className="text-xs font-bold text-purple transition-colors hover:text-purple-hover">
                {REGISTERABLE_STATUSES.includes(registrationStatus as string)
                  ? 'Register'
                  : !domain.price && registrationStatus === 'Registered'
                    ? 'Make Offer'
                    : 'Buy now'}
              </p>
            )}
          </button>
          <div className="flex items-center gap-x-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <Watchlist domain={domain} />
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect(e, domain)
              }}
              disabled={canAddToCart}
              className={`  ${canAddToCart ? 'opacity-0' : 'opacity-100'
                }`}
            >
              <CartIcon name={domain.name} size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Card
