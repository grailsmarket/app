import Image from 'next/image'
import Link from 'next/link'
import { hexToBigInt, namehash, numberToHex, type Address } from 'viem'
import { MetadataType, RolesType } from '@/types/api'
import { DomainListingType, DomainOfferType, MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { TOKENS } from '@/constants/web3/tokens'
import { beautifyName } from '@/lib/ens'
import { formatPrice } from '@/utils/formatPrice'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { localizeNumber } from '@/utils/localizeNumber'

interface ServerPanelsProps {
  name: string
  nameDetails?: MarketplaceDomainType | null
  offers?: DomainOfferType[]
  metadata?: MetadataType[]
  roles?: RolesType | null
}

const formatSummaryDate = (date: string | null | undefined, includeTime = true) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: includeTime ? '2-digit' : undefined,
    minute: includeTime ? '2-digit' : undefined,
  })
    .format(new Date(date))
    .replace(',', '')
    .replaceAll('/', includeTime ? '-' : '/')
}

const truncateAddress = (address: string | null | undefined) => {
  if (!address) return '-'
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

const formatTokenPrice = (price: string | number | null | undefined, currencyAddress?: Address | null) => {
  if (!price || !currencyAddress) return '-'

  const asset = TOKENS[currencyAddress as keyof typeof TOKENS]
  const formatted = formatPrice(price, asset)

  return formatted ? `${formatted} ${asset}` : '-'
}

const getNameImageUrl = (name: string, expiryDate: string | null | undefined) => {
  const tokenId = hexToBigInt(namehash(name)).toString()
  const expires = expiryDate ? new Date(expiryDate).getTime() : ''

  return `/api/og/ens-name/${tokenId}?name=${encodeURIComponent(name)}&expires=${encodeURIComponent(expires)}`
}

const CopyableText = ({ value, truncate = true }: { value: string; truncate?: boolean }) => (
  <p className='max-w-full truncate text-xl font-medium'>{truncate ? truncateAddress(value) : value}</p>
)

export default function ServerPanels({ name, nameDetails, offers = [], metadata = [], roles }: ServerPanelsProps) {
  const isSubname = name.split('.').length > 2
  const registrationStatus: RegistrationStatus = nameDetails
    ? isSubname
      ? REGISTERED
      : getRegistrationStatus(nameDetails.expiry_date)
    : UNREGISTERED
  const isRegistered = registrationStatus === REGISTERED

  return (
    <div className='dark mx-auto flex min-h-[calc(100dvh-52px)] max-w-7xl flex-col items-center gap-3 pt-3 md:min-h-[calc(100dvh-70px)]'>
      <div className='px-md flex w-full flex-row justify-between'>
        <ServerActions nameDetails={nameDetails} />
      </div>
      <div className='flex w-full flex-col gap-1 sm:gap-4 lg:flex-row'>
        <div className='flex h-fit flex-col gap-1 sm:gap-4 sm:rounded-lg lg:w-2/5'>
          <ServerPrimaryDetails
            name={name}
            nameDetails={nameDetails}
            registrationStatus={registrationStatus}
            isSubname={isSubname}
          />
          <div className='hidden lg:block'>
            <ServerCategories nameDetails={nameDetails} />
          </div>
          <div className='hidden lg:block'>
            <ServerMetadata name={name} metadata={metadata} />
          </div>
          <div className='hidden lg:block'>
            <ServerRoles roles={roles} />
          </div>
          <div className='hidden lg:block'>
            <ServerSecondaryDetails nameDetails={nameDetails} roles={roles} />
          </div>
        </div>
        <div className='flex w-full flex-col gap-1 sm:gap-4 lg:w-3/5'>
          {isRegistered ? (
            <>
              <ServerListings domain={nameDetails} listings={nameDetails?.listings || []} />
              <ServerOffers domain={nameDetails} offers={offers} />
            </>
          ) : (
            <ServerRegisterSummary nameDetails={nameDetails} registrationStatus={registrationStatus} />
          )}
          <div className='lg:hidden'>
            <ServerCategories nameDetails={nameDetails} />
          </div>
          <div className='lg:hidden'>
            <ServerMetadata name={name} metadata={metadata} />
          </div>
          <div className='lg:hidden'>
            <ServerRoles roles={roles} />
          </div>
          <div className='lg:hidden'>
            <ServerSecondaryDetails nameDetails={nameDetails} roles={roles} />
          </div>
          <ServerClientOnlyPlaceholder title='Activity' description='Activity loads in the interactive app.' />
          <ServerClientOnlyPlaceholder title='Comments' description='Comments load in the interactive app.' />
          <ServerClientOnlyPlaceholder title='Recommended' description='Recommendations load in the interactive app.' />
        </div>
      </div>
    </div>
  )
}

const ServerActions = ({ nameDetails }: { nameDetails?: MarketplaceDomainType | null }) => (
  <div className='flex w-full flex-row justify-between gap-2'>
    <div className='flex w-full flex-row justify-between gap-4 sm:justify-start md:w-fit'>
      <div className='flex flex-row items-center gap-2'>
        <p className='text-lg font-semibold'>{nameDetails?.view_count ?? 0}</p>
        <p className='text-neutral text-lg'>views</p>
      </div>
      <div className='flex flex-row items-center gap-2'>
        <p className='text-lg font-semibold'>{nameDetails?.watchers_count ?? 0}</p>
        <p className='text-neutral text-lg'>watchers</p>
      </div>
    </div>
  </div>
)

const ServerPrimaryDetails = ({
  name,
  nameDetails,
  registrationStatus,
  isSubname,
}: {
  name: string
  nameDetails?: MarketplaceDomainType | null
  registrationStatus: RegistrationStatus
  isSubname: boolean
}) => (
  <div className='bg-secondary border-tertiary flex flex-col sm:rounded-lg sm:border-2'>
    <div className='bg-tertiary h-fit w-full'>
      <Image
        src={getNameImageUrl(name, nameDetails?.expiry_date)}
        alt={`${name} preview`}
        width={1024}
        height={1024}
        className='bg-tertiary mx-auto aspect-square w-full max-w-lg object-cover'
        priority
      />
    </div>
    <div className='p-lg flex flex-col items-center gap-3 lg:pt-5'>
      <div className='flex w-full flex-row items-center justify-between gap-2'>
        <h1 className='max-w-[calc(100%-52px)] truncate text-2xl font-bold md:text-3xl'>
          {nameDetails?.name ? beautifyName(nameDetails.name) : name}
        </h1>
      </div>
      <div className='border-neutral flex w-full flex-row items-center justify-between gap-2 border-l-2 pt-0.5 pl-2'>
        <div className='flex flex-col items-start gap-0.5'>
          {nameDetails?.owner && <CopyableText value={nameDetails.owner} />}
          <p className='text-neutral text-lg font-medium'>
            {registrationStatus === UNREGISTERED ? 'Previous Owner' : 'Owner'}
          </p>
        </div>
        {nameDetails?.owner && (
          <p className='text-neutral hidden max-w-[50%] truncate font-mono sm:block'>{nameDetails.owner}</p>
        )}
      </div>
      <div className='grid w-full grid-cols-2 gap-2 py-2'>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>{formatSummaryDate(nameDetails?.expiry_date, false)}</p>
          <p className='text-neutral text-lg font-medium'>Expiration</p>
        </div>
        {!isSubname && (
          <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
            <p className='text-xl font-semibold tabular-nums'>{registrationStatus}</p>
            <p className='text-neutral text-lg font-medium'>Status</p>
          </div>
        )}
      </div>
    </div>
  </div>
)

const ServerCategories = ({ nameDetails }: { nameDetails?: MarketplaceDomainType | null }) => (
  <section className='bg-secondary border-tertiary p-lg flex flex-col gap-2 sm:rounded-lg sm:border-2'>
    <div className='mb-2 flex flex-row items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>Categories</h2>
      <p className='text-xl font-bold'>{nameDetails?.clubs?.length || 0}</p>
    </div>
    {nameDetails?.clubs && nameDetails.clubs.length > 0 ? (
      nameDetails.clubs.map((club) => {
        const categoryDetails = getCategoryDetails(club)
        const clubRank = nameDetails.club_ranks?.find((rank) => rank.club === club)?.rank

        return (
          <Link
            key={club}
            href={`/categories/${club}`}
            className='px-md bg-tertiary py-md hover:bg-foreground/20 relative flex w-full gap-1 overflow-hidden rounded-lg font-medium transition-colors'
          >
            <Image
              src={categoryDetails.header}
              alt={club}
              width={1000}
              height={1000}
              className='absolute top-0 left-0 h-full w-full object-cover opacity-20'
            />
            <div className='relative z-10 flex w-full flex-row items-center gap-2'>
              <Image
                src={categoryDetails.avatar}
                alt={club}
                width={40}
                height={40}
                className='aspect-square! rounded-full'
              />
              <div className='max-w-[calc(100%-60px)]'>
                <p className='text-xl font-semibold text-nowrap'>
                  {club} {clubRank ? `#${localizeNumber(clubRank)}` : ''}
                </p>
              </div>
            </div>
          </Link>
        )
      })
    ) : (
      <p className='text-neutral pb-2 text-center text-lg font-medium'>No categories</p>
    )}
  </section>
)

const ServerMetadata = ({ name, metadata = [] }: { name: string; metadata?: MetadataType[] }) => (
  <section className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
    <div className='flex flex-row items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>Records</h2>
      <p className='text-xl font-bold'>{metadata.length}</p>
    </div>
    {metadata.length > 0 ? (
      <div className='grid grid-cols-2 gap-4'>
        {metadata.map((row) => (
          <div
            key={`${name}-${row.label}`}
            className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'
          >
            <p className='max-w-full truncate text-xl font-medium'>{row.value}</p>
            <p className='text-neutral text-lg font-medium'>{row.label.toLowerCase()}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className='text-neutral pb-2 text-center text-xl font-medium'>No records found</div>
    )}
  </section>
)

const ServerRoles = ({ roles }: { roles?: RolesType | null }) => (
  <section className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
    <div className='flex flex-row items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>Roles</h2>
    </div>
    {roles ? (
      <div className='grid grid-cols-2 gap-4'>
        <div className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
          <CopyableText value={roles.owner} />
          <p className='text-neutral text-lg font-medium'>Owner</p>
        </div>
        <div className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
          <CopyableText value={roles.manager} />
          <p className='text-neutral text-lg font-medium'>Manager</p>
        </div>
      </div>
    ) : (
      <div className='text-neutral pb-2 text-center text-xl font-medium'>No records found</div>
    )}
  </section>
)

const ServerSecondaryDetails = ({
  nameDetails,
  roles,
}: {
  nameDetails?: MarketplaceDomainType | null
  roles?: RolesType | null
}) => {
  const rows = [
    {
      label: 'Last Sale',
      value: formatTokenPrice(nameDetails?.last_sale_price, nameDetails?.last_sale_currency as Address | null),
    },
    { label: 'Token ID', value: nameDetails?.token_id || null },
    { label: 'Namehash', value: nameDetails?.token_id ? numberToHex(BigInt(nameDetails.token_id)).toString() : null },
    { label: 'Creation Date', value: formatSummaryDate(nameDetails?.creation_date) },
  ].filter((row) => row.value)

  return (
    <section className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div className='flex flex-row items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Details</h2>
      </div>
      <div className='grid grid-cols-2 gap-4'>
        {rows.map((row) => (
          <div key={row.label} className='bg-secondary border-neutral pl-md flex w-full flex-col border-l-2'>
            <p className='max-w-full truncate text-xl font-medium'>{row.value}</p>
            <p className='text-neutral text-lg font-medium'>{row.label}</p>
          </div>
        ))}
        {roles && (
          <div className='bg-secondary border-neutral pl-md flex w-full flex-col border-l-2'>
            <CopyableText value={roles.resolver || '-'} />
            <p className='text-neutral text-lg font-medium'>Resolver</p>
          </div>
        )}
      </div>
    </section>
  )
}

const ServerListings = ({
  domain,
  listings,
}: {
  domain?: MarketplaceDomainType | null
  listings: DomainListingType[]
}) => {
  const sortedListings = [...listings].sort((a, b) => {
    const priceDiff = Number(a.price) - Number(b.price)
    if (priceDiff !== 0) return priceDiff
    if (a.source === 'grails' && b.source !== 'grails') return -1
    if (b.source === 'grails' && a.source !== 'grails') return 1
    return 0
  })

  return (
    <section className='p-lg lg:px-xl sm:border-tertiary bg-secondary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div className='flex w-full items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Listings</h2>
      </div>
      {sortedListings.slice(0, 2).map((listing) => (
        <ServerListingRow key={listing.id} listing={listing} domain={domain} />
      ))}
      {sortedListings.length === 0 && (
        <div className='flex w-full flex-row items-center justify-center gap-2'>
          <p className='text-neutral text-lg'>No listings found</p>
        </div>
      )}
    </section>
  )
}

const ServerListingRow = ({
  listing,
  domain,
}: {
  listing: DomainListingType
  domain?: MarketplaceDomainType | null
}) => (
  <div className='flex flex-row items-center justify-between gap-2'>
    <div className='flex flex-row items-center gap-2 sm:gap-4'>
      <Image
        src={SOURCE_ICONS[listing.source as keyof typeof SOURCE_ICONS]}
        width={32}
        height={32}
        alt={listing.source}
        className='h-auto w-7 sm:w-8'
      />
      <div className='flex flex-col gap-1'>
        <div className='flex flex-row items-center gap-2'>
          <p className='text-2xl font-semibold'>
            {formatTokenPrice(listing.price_wei || listing.price, listing.currency_address)}
          </p>
          {listing.broker_address && listing.broker_fee_bps && (
            <Link
              href={`/profile/${listing.broker_address}?tab=broker`}
              className='bg-primary/20 text-primary rounded-md px-2 py-1 text-xs font-semibold'
            >
              Brokered
            </Link>
          )}
        </div>
        <p className='sm:text-md text-neutral text-sm'>{formatSummaryDate(listing.expires_at)}</p>
      </div>
    </div>
    <p className='text-neutral hidden max-w-[35%] truncate text-sm sm:block'>
      {domain?.owner && listing.seller_address.toLowerCase() === domain.owner.toLowerCase()
        ? 'Owner listing'
        : 'Marketplace listing'}
    </p>
  </div>
)

const ServerOffers = ({ domain, offers }: { domain?: MarketplaceDomainType | null; offers: DomainOfferType[] }) => {
  const sortedOffers = [...offers].sort((a, b) => {
    const priceDiff = Number(b.offer_amount_wei) - Number(a.offer_amount_wei)
    if (priceDiff !== 0) return priceDiff
    if (a.source === 'grails' && b.source !== 'grails') return -1
    if (b.source === 'grails' && a.source !== 'grails') return 1
    return 0
  })

  return (
    <section className='p-lg lg:px-xl sm:border-tertiary bg-secondary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div className='flex w-full items-center justify-between'>
        <h2 className='font-sedan-sc text-3xl'>Offers</h2>
      </div>
      {sortedOffers.slice(0, 2).map((offer) => (
        <ServerOfferRow key={offer.id} offer={offer} domain={domain} />
      ))}
      {sortedOffers.length === 0 && (
        <div className='flex w-full flex-row items-center justify-center gap-2'>
          <p className='text-neutral text-lg'>No offers found</p>
        </div>
      )}
    </section>
  )
}

const ServerOfferRow = ({ offer, domain }: { offer: DomainOfferType; domain?: MarketplaceDomainType | null }) => {
  const fee = offer.source === 'opensea' ? 0.01 : 0

  return (
    <div className='flex flex-row items-center justify-between gap-2'>
      <div className='flex flex-row items-center gap-2 sm:gap-4'>
        <Image
          src={SOURCE_ICONS[offer.source as keyof typeof SOURCE_ICONS]}
          width={32}
          height={32}
          alt={offer.source}
          className='h-auto min-w-7 sm:w-8'
        />
        <div className='flex flex-col gap-1'>
          <div className='flex flex-row items-center gap-1.5'>
            <p className='text-2xl font-semibold'>{formatTokenPrice(offer.offer_amount_wei, offer.currency_address)}</p>
            <p className={`text-md ${fee > 0 ? 'text-red-400' : 'text-green-500'}`}>({fee * 100}% fee)</p>
          </div>
          <p className='sm:text-md text-neutral text-sm'>{formatSummaryDate(offer.expires_at)}</p>
        </div>
      </div>
      <p className='text-neutral hidden max-w-[35%] truncate text-sm sm:block'>
        {domain?.owner && offer.buyer_address.toLowerCase() === domain.owner.toLowerCase()
          ? 'Owner offer'
          : truncateAddress(offer.buyer_address)}
      </p>
    </div>
  )
}

const ServerRegisterSummary = ({
  nameDetails,
  registrationStatus,
}: {
  nameDetails?: MarketplaceDomainType | null
  registrationStatus: RegistrationStatus
}) => (
  <section className='p-lg lg:p-xl bg-secondary sm:border-tertiary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
    <div className='flex flex-row items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>
        {registrationStatus === UNREGISTERED ? 'Register' : `${registrationStatus} Registration`}
      </h2>
    </div>
    <p className='text-light-150 text-xl'>
      {nameDetails?.name ? beautifyName(nameDetails.name) : 'This name'} is currently {registrationStatus.toLowerCase()}
      .
    </p>
  </section>
)

const ServerClientOnlyPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <section className='sm:border-tertiary bg-secondary pt-lg flex w-full flex-col gap-1 sm:rounded-lg sm:border-2 lg:gap-2'>
    <div className='px-lg xl:px-xl flex items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>{title}</h2>
    </div>
    <div className='py-2xl flex w-full flex-col items-center justify-center gap-3 px-4 text-center'>
      <p className='text-neutral text-lg'>{description}</p>
    </div>
  </section>
)
