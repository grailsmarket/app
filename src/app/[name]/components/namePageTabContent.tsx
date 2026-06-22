'use client'

import React from 'react'
import Listings from './listings'
import Offers from './offers'
import ActivityPanel from './activity'
import Register from './register'
import Metadata from './metadata'
import Roles from './roles'
import SecondaryDetails from './secondaryDetails'
import ValuationPanel from './valuation'
import { DomainOfferType, MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { MetadataType, RolesType } from '@/types/api'
import type { NamePageTab } from './name'

interface Props {
  selectedTab: NamePageTab
  name: string
  isRegistered: boolean
  registrationStatus: RegistrationStatus
  nameDetails?: MarketplaceDomainType
  nameDetailsIsLoading: boolean
  nameOffers?: DomainOfferType[]
  nameOffersIsLoading: boolean
  metadata?: MetadataType[]
  isMetadataLoading: boolean
  roles?: RolesType | null
  isRolesLoading: boolean
  openEditMetadataModal: () => void
}

const NamePageTabContent: React.FC<Props> = ({
  selectedTab,
  name,
  isRegistered,
  registrationStatus,
  nameDetails,
  nameDetailsIsLoading,
  nameOffers,
  nameOffersIsLoading,
  metadata,
  isMetadataLoading,
  roles,
  isRolesLoading,
  openEditMetadataModal,
}) => {
  switch (selectedTab) {
    case 'market':
      return isRegistered ? (
        <>
          <Listings
            domain={nameDetails}
            listings={nameDetails?.listings || []}
            listingsLoading={nameDetailsIsLoading}
          />
          <Offers offers={nameOffers ?? []} offersLoading={nameOffersIsLoading} domain={nameDetails} />
        </>
      ) : (
        <Register nameDetails={nameDetails} registrationStatus={registrationStatus} />
      )
    case 'activity':
      return <ActivityPanel name={name} />
    case 'valuation':
      return <ValuationPanel key={`valuation-${name}`} name={name} ownerAddress={nameDetails?.owner} />
    case 'details':
      return (
        <>
          <Metadata
            name={name}
            registrationStatus={registrationStatus}
            nameOwner={nameDetails?.owner}
            metadata={metadata}
            isMetadataLoading={isMetadataLoading}
            openEditMetadataModal={openEditMetadataModal}
          />
          <Roles
            name={name}
            registrationStatus={registrationStatus}
            nameOwner={nameDetails?.owner}
            metadata={metadata}
            roles={roles}
            isRolesLoading={isRolesLoading}
          />
          <SecondaryDetails nameDetails={nameDetails} nameDetailsIsLoading={nameDetailsIsLoading} roles={roles} />
        </>
      )
    default:
      return null
  }
}

export default NamePageTabContent
