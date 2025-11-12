import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React, { MouseEventHandler } from 'react'
import CartIcon from './CartIcon'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { setMakeListingModalDomain, setMakeListingModalOpen } from '@/state/reducers/modals/makeListingModal'
import { setCancelListingModalListing, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import Watchlist from '@/components/ui/watchlist'
import {
  addBulkRenewalModalDomain,
  removeBulkRenewalModalDomain,
  selectBulkRenewalModal,
} from '@/state/reducers/modals/bulkRenewalModal'
import { Check } from 'ethereum-identity-kit'
import Link from 'next/link'

interface ActionsProps {
  domain: MarketplaceDomainType
  index: number
  columnCount: number
  canAddToCart: boolean
  watchlistId?: number | undefined
  isBulkRenewing?: boolean
}

const Actions: React.FC<ActionsProps> = ({ domain, columnCount, canAddToCart, index, watchlistId, isBulkRenewing }) => {
  const dispatch = useAppDispatch()
  const { filterType } = useFilterContext()
  const { domains: bulkRenewalDomains } = useAppSelector(selectBulkRenewalModal)
  const { selectedTab } = useAppSelector(selectUserProfile)
  const width = ALL_MARKETPLACE_COLUMNS['actions'].getWidth(columnCount)
  const domainListing = domain.listings[0]

  const openListModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setMakeListingModalDomain(domain))
    dispatch(setMakeListingModalOpen(true))
  }

  const openCancelListingModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(
      setCancelListingModalListing({
        id: domainListing.id,
        name: domain.name,
        price: domainListing.price,
        currency: domainListing.currency_address,
        expires: domainListing.expires_at,
      })
    )
    dispatch(setCancelListingModalOpen(true))
  }

  if (filterType === 'portfolio') {
    if (selectedTab.value === 'domains') {
      if (isBulkRenewing) {
        const isSelected = bulkRenewalDomains.some((d) => d.name === domain.name)
        return (
          <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
            {isSelected ? (
              <PrimaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(removeBulkRenewalModalDomain(domain))
                }}
                className='flex flex-row items-center gap-1'
              >
                <p>Selected</p>
                <Check className='text-background h-3 w-3' />
              </PrimaryButton>
            ) : (
              <SecondaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(addBulkRenewalModalDomain(domain))
                }}
              >
                Select
              </SecondaryButton>
            )}
          </div>
        )
      }
      if (domainListing?.price) {
        return (
          <>
            <div className={cn('hidden flex-row justify-end gap-2 opacity-100 sm:flex', width)}>
              <SecondaryButton onClick={openListModal}>Edit</SecondaryButton>
              <SecondaryButton onClick={openCancelListingModal}>Cancel</SecondaryButton>
            </div>
            <div className={cn('flex flex-row justify-end sm:hidden', width)}>
              <Link href={`/${domain.name}`}>
                <SecondaryButton>Edit</SecondaryButton>
              </Link>
            </div>
          </>
        )
      }
      return (
        <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
          {/* <SecondaryButton onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dispatch(setBulkRenewalModalOpen(true))
            dispatch(setBulkRenewalModalDomains([domain]))
          }}>Extend</SecondaryButton> */}
          <PrimaryButton onClick={openListModal}>List</PrimaryButton>
        </div>
      )
    }
  }

  return (
    <div className={cn('flex flex-row justify-end opacity-100', width)}>
      <div className='flex items-center lg:gap-x-2'>
        {watchlistId && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className='flex flex-row items-center gap-2'
          >
            <Watchlist
              domain={domain}
              showSettings={true}
              tooltipPosition={index === 0 ? 'bottom' : 'top'}
              dropdownPosition='left'
              watchlistId={watchlistId}
            />
          </div>
        )}
        {canAddToCart && (
          <button className={`cursor-pointer rounded-sm p-1.5`}>
            <CartIcon domain={domain} />
          </button>
        )}
      </div>
    </div>
  )
}

export default Actions
