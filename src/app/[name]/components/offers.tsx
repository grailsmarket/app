import React, { useMemo, useState } from 'react'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import Image from 'next/image'
import { Address, LoadingCell } from 'ethereum-identity-kit'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Price from '@/components/ui/price'
import User from '@/components/ui/user'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { useAppDispatch } from '@/state/hooks'
import PrimaryButton from '@/components/ui/buttons/primary'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useAccount } from 'wagmi'
import { setAcceptOfferModalDomain, setAcceptOfferModalOffer, setAcceptOfferModalOpen } from '@/state/reducers/modals/acceptOfferModal'
import { setCancelOfferModalName, setCancelOfferModalOffer, setCancelOfferModalOpen } from '@/state/reducers/modals/cancelOfferModal'

interface OffersProps {
  domain?: MarketplaceDomainType
  offers: DomainOfferType[]
  offersLoading: boolean
}

const Offers: React.FC<OffersProps> = ({ offers, offersLoading, domain }) => {
  const dispatch = useAppDispatch()
  const { address: userAddress } = useAccount()
  const [viewAll, setViewAll] = useState(false)
  const showViewAllButton = offers.length > 2
  const displayedOffers = viewAll ? offers : offers.slice(0, 2)
  const isMyDomain = useMemo(
    () => domain?.owner?.toLowerCase() === userAddress?.toLowerCase(),
    [domain?.owner, userAddress]
  )

  const openOfferModal = () => {
    if (!domain) return
    dispatch(setMakeOfferModalOpen(true))
    dispatch(setMakeOfferModalDomain(domain))
  }

  return (
    <div className='p-xl border-primary bg-secondary flex w-full flex-col gap-4 rounded-lg border-2'>
      <div className='flex w-full items-center justify-between'>
        <h3 className='font-sedan-sc text-3xl'>Offers</h3>
        {!isMyDomain && <PrimaryButton onClick={openOfferModal}>Make Offer</PrimaryButton>}
      </div>
      {offersLoading ? (
        <LoadingCell height='60px' width='100%' />
      ) : (
        displayedOffers
          .sort((a, b) => Number(b.offer_amount_wei) - Number(a.offer_amount_wei))
          .map((offer) => (
            <div key={offer.id} className='flex flex-row items-center justify-between gap-2'>
              <div className='flex flex-row items-center gap-4'>
                <div className='flex flex-row items-center gap-2'>
                  <Image
                    src={SOURCE_ICONS[offer.source as keyof typeof SOURCE_ICONS]}
                    width={32}
                    height={32}
                    alt={offer.source}
                  />
                  {/* <p>{SOURCE_LABELS[offer.source as keyof typeof SOURCE_LABELS]}</p> */}
                </div>
                <div className='flex flex-row items-center gap-2'>
                  <Price
                    price={offer.offer_amount_wei}
                    currencyAddress={offer.currency_address}
                    fontSize='text-2xl font-semibold'
                    iconSize='24px'
                  />
                </div>
              </div>
              <div className='flex flex-row items-center gap-2'>
                <p className='break-words'>{formatExpiryDate(offer.expires_at)}</p>
              </div>
              <ActionButtons offer={offer} userAddress={userAddress} isMyDomain={isMyDomain} domain={domain} />
            </div>
          ))
      )}
      {!offersLoading && offers.length === 0 && (
        <div className='p-2xl flex w-full flex-row items-center justify-center gap-2'>
          <p className='text-neutral text-lg'>No offers found</p>
        </div>
      )}
      {showViewAllButton && (
        <button onClick={() => setViewAll(!viewAll)} className='text-light-600 text-sm'>
          {viewAll ? 'View Less' : 'View All'}
        </button>
      )}
    </div>
  )
}

interface ActionButtonsProps {
  offer: DomainOfferType
  userAddress?: Address
  isMyDomain: boolean
  domain?: MarketplaceDomainType
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ offer, userAddress, isMyDomain, domain }) => {
  const isMyOffer = offer.buyer_address.toLowerCase() === userAddress?.toLowerCase()

  const dispatch = useAppDispatch()
  const openAcceptOfferModal = () => {
    if (!domain) return
    dispatch(setAcceptOfferModalOpen(true))
    dispatch(setAcceptOfferModalOffer(offer))
    dispatch(setAcceptOfferModalDomain(domain))
  }

  const openCancelOfferModal = () => {
    if (!domain) return
    dispatch(setCancelOfferModalOpen(true))
    dispatch(setCancelOfferModalOffer(offer))
    dispatch(setCancelOfferModalName(domain.name))
  }

  if (isMyDomain) {
    return (
      <div className='flex flex-row items-center gap-2'>
        <User address={offer.buyer_address} />
        <PrimaryButton onClick={openAcceptOfferModal}>Accept</PrimaryButton>
      </div>
    )
  }

  if (isMyOffer) {
    return (
      <div className='flex flex-row items-center gap-2'>
        <SecondaryButton onClick={openCancelOfferModal}>Cancel</SecondaryButton>
      </div>
    )
  }

  return (
    <div className='flex flex-row items-center gap-2'>
      <User address={offer.buyer_address} />
    </div>
  )
}

export default Offers
