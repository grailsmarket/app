import Image from 'next/image'
import NameVersionBadge from '@/components/ui/nameVersionBadge'
import Link from 'next/link'
import { hexToBigInt, namehash, type Address } from 'viem'
import { DomainListingType, MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import { REGISTERED, UNKNOWN, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { TOKENS } from '@/constants/web3/tokens'
import { beautifyName } from '@/lib/ens'
import { formatPrice } from '@/utils/formatPrice'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { localizeNumber } from '@/utils/localizeNumber'

interface ServerPanelsProps {
  name: string
  nameDetails?: MarketplaceDomainType | null
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

const getNameImageUrl = (
  name: string,
  expiryDate: string | null | undefined,
  version: number,
  status: RegistrationStatus
) => {
  const tokenId = hexToBigInt(namehash(name)).toString()
  const expires = expiryDate ? new Date(expiryDate).getTime() : ''

  return `/api/og/ens-name/${tokenId}?name=${encodeURIComponent(name)}&version=${version}&expires=${encodeURIComponent(expires)}&status=${status}`
}

const CopyableText = ({ value, truncate = true }: { value: string; truncate?: boolean }) => (
  <p className='max-w-full truncate text-xl font-medium'>{truncate ? truncateAddress(value) : value}</p>
)

export default function ServerPanels({ name, nameDetails }: ServerPanelsProps) {
  const isSubname = name.split('.').length > 2
  const registrationStatus: RegistrationStatus = nameDetails?.id
    ? isSubname
      ? REGISTERED
      : getRegistrationStatus(nameDetails)
    : UNKNOWN
  const isRegistered = registrationStatus === REGISTERED

  return (
    <div className='dark mx-auto flex min-h-[calc(100dvh-52px)] max-w-7xl flex-col items-center gap-3 pt-3 md:min-h-[calc(100dvh-70px)]'>
      <div className='px-md flex w-full flex-row justify-between'>
        <ServerActions nameDetails={nameDetails} />
      </div>
      {nameDetails?.compromised && (
        <div className='px-md w-full'>
          <div className='flex w-full flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
            <p className='text-lg font-bold text-red-400'>⚠️ This name was reported stolen</p>
            <p className='text-md text-red-400'>
              {nameDetails.compromised.incident.description ||
                `This name was taken from its owner in the ${nameDetails.compromised.incident.title}.`}{' '}
              Listings can only be bought, and offers only accepted, by the original owner (
              {truncateAddress(nameDetails.compromised.original_owner)}).
            </p>
          </div>
        </div>
      )}
      <div className='flex w-full flex-col gap-1 @[40rem]/app:gap-4 @[64rem]/app:flex-row'>
        <div className='flex h-fit flex-col gap-1 @[40rem]/app:gap-4 @[40rem]/app:rounded-lg @[64rem]/app:w-2/5'>
          <ServerPrimaryDetails
            name={name}
            nameDetails={nameDetails}
            registrationStatus={registrationStatus}
            isSubname={isSubname}
          />
          <div className='hidden @[64rem]/app:block'>
            <ServerCategories nameDetails={nameDetails} />
          </div>
        </div>
        <div className='flex w-full flex-col gap-1 @[40rem]/app:gap-4 @[64rem]/app:w-3/5'>
          <div className='@[64rem]/app:hidden'>
            <ServerCategories nameDetails={nameDetails} />
          </div>
          {isRegistered ? (
            <>
              <ServerListings domain={nameDetails} listings={nameDetails?.listings || []} />
              <ServerOffersSkeleton />
            </>
          ) : (
            <ServerRegisterSummary nameDetails={nameDetails} registrationStatus={registrationStatus} />
          )}
          <ServerClientOnlyPlaceholder title='Comments' description='Comments load in the interactive app.' />
          <ServerClientOnlyPlaceholder title='Recommended' description='Recommendations load in the interactive app.' />
        </div>
      </div>
    </div>
  )
}

const ServerActions = ({ nameDetails }: { nameDetails?: MarketplaceDomainType | null }) => (
  <div className='flex w-full flex-row justify-between gap-2'>
    <div className='flex w-full flex-row justify-between gap-4 @[40rem]/app:justify-start @[48rem]/app:w-fit'>
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
  <div className='bg-secondary border-tertiary flex flex-col @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
    <div className='bg-tertiary relative h-fit w-full'>
      <Image
        src={getNameImageUrl(name, nameDetails?.expiry_date, nameDetails?.version ?? 1, registrationStatus)}
        alt={`${name} preview`}
        width={1024}
        height={1024}
        className='bg-tertiary mx-auto aspect-square w-full max-w-lg object-cover'
        priority
      />
      <div className='absolute top-2 right-2 z-10'>
        <NameVersionBadge version={nameDetails?.version} align='right' />
      </div>
    </div>
    <div className='p-lg flex flex-col items-center gap-3 @[64rem]/app:pt-5'>
      <div className='flex w-full flex-row items-center justify-between gap-2'>
        <h1 className='max-w-[calc(100%-52px)] truncate text-2xl font-bold @[48rem]/app:text-3xl'>
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
          <p className='text-neutral hidden max-w-[50%] truncate font-mono @[40rem]/app:block'>{nameDetails.owner}</p>
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
  <section className='bg-secondary border-tertiary p-lg flex flex-col gap-2 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
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
    <section className='p-lg @[64rem]/app:px-xl @[40rem]/app:border-tertiary bg-secondary flex w-full flex-col gap-4 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
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
    <div className='flex flex-row items-center gap-2 @[40rem]/app:gap-4'>
      <Image
        src={SOURCE_ICONS[listing.source as keyof typeof SOURCE_ICONS]}
        width={32}
        height={32}
        alt={listing.source}
        className='h-auto w-7 @[40rem]/app:w-8'
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
        <p className='@[40rem]/app:text-md text-neutral text-sm'>{formatSummaryDate(listing.expires_at)}</p>
      </div>
    </div>
    <p className='text-neutral hidden max-w-[35%] truncate text-sm @[40rem]/app:block'>
      {domain?.owner && listing.seller_address.toLowerCase() === domain.owner.toLowerCase()
        ? 'Owner listing'
        : 'Marketplace listing'}
    </p>
  </div>
)

const ServerOffersSkeleton = () => (
  <section className='p-lg @[64rem]/app:px-xl @[40rem]/app:border-tertiary bg-secondary flex w-full flex-col gap-4 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
    <div className='flex w-full items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>Offers</h2>
    </div>
    <div role='status' aria-label='Loading offers' className='bg-tertiary h-[60px] w-full animate-pulse rounded' />
  </section>
)

const ServerRegisterSummary = ({
  nameDetails,
  registrationStatus,
}: {
  nameDetails?: MarketplaceDomainType | null
  registrationStatus: RegistrationStatus
}) => (
  <section className='p-lg @[64rem]/app:p-xl bg-secondary @[40rem]/app:border-tertiary flex w-full flex-col gap-4 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
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
  <section className='@[40rem]/app:border-tertiary bg-secondary pt-lg flex w-full flex-col gap-1 @[40rem]/app:rounded-lg @[40rem]/app:border-2 @[64rem]/app:gap-2'>
    <div className='px-lg @[80rem]/app:px-xl flex items-center justify-between'>
      <h2 className='font-sedan-sc text-3xl'>{title}</h2>
    </div>
    <div className='py-2xl flex w-full flex-col items-center justify-center gap-3 px-4 text-center'>
      <p className='text-neutral text-lg'>{description}</p>
    </div>
  </section>
)
