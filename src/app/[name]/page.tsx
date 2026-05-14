import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import NamePage from './components/name'
import { beautifyName } from '@/lib/ens'
import { notFound } from 'next/navigation'
import { fetchNameDetails } from '@/api/name/details'
import { fetchNameMetadata, formatNameMetadata } from '@/api/name/metadata'
import { fetchNameOffers } from '@/api/name/offers'
import { fetchNameRoles } from '@/api/name/roles'
import { ONE_MINUTE } from '@/constants/time'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import { MetadataType, RolesType } from '@/types/api'

interface Props {
  params: Promise<{ name: string }>
  searchParams: Promise<SearchParams>
}

const PREFETCH_STALE_TIME = 3 * ONE_MINUTE * 1000

const formatSummaryDate = (date: string | null | undefined) => {
  if (!date) return 'Unknown'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

const truncateAddress = (address: string | null | undefined) => {
  if (!address) return 'Unknown'
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

const NameSemanticSummary = ({
  name,
  details,
  offers,
  metadata,
  roles,
}: {
  name: string
  details?: MarketplaceDomainType
  offers?: DomainOfferType[]
  metadata?: MetadataType[]
  roles?: RolesType | null
}) => {
  const isSubname = name.split('.').length > 2
  const status = details ? (isSubname ? 'Registered' : getRegistrationStatus(details.expiry_date)) : 'Unknown'
  const description = metadata?.find((row) => row.label === 'description')?.value
  const owner = roles?.owner || details?.owner

  return (
    <section
      aria-labelledby='name-summary-title'
      className='bg-secondary border-tertiary mx-auto mt-3 w-full max-w-7xl rounded-lg border-2 p-4 text-sm sm:p-5'
    >
      <div className='flex flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <p className='text-neutral text-lg font-medium'>ENS name</p>
          <h1 id='name-summary-title' className='truncate text-3xl font-bold md:text-4xl'>
            {name}
          </h1>
          {description && <p className='text-neutral mt-2 max-w-3xl text-lg'>{description}</p>}
        </div>
        <p className='bg-tertiary w-fit rounded-sm px-3 py-1 text-lg font-semibold'>{status}</p>
      </div>
      <dl className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>Owner</dt>
          <dd className='font-mono text-lg font-semibold'>{truncateAddress(owner)}</dd>
        </div>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>Expires</dt>
          <dd className='text-lg font-semibold'>{formatSummaryDate(details?.expiry_date)}</dd>
        </div>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>Listings</dt>
          <dd className='text-lg font-semibold'>{details?.listings?.length ?? 0}</dd>
        </div>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>Offers</dt>
          <dd className='text-lg font-semibold'>{offers?.length ?? 0}</dd>
        </div>
      </dl>
    </section>
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const name = beautifyName(decodeURIComponent(params.name))
  const imageUrl = `https://grails-git-new-metadata-service-efp.vercel.app/api/og/name?name=${encodeURIComponent(name)}`
  // const imageUrl = `https://grails.app/previews/home.jpeg`

  return {
    title: `${name}`,
    description: `${name} - Available on Grails`,
    openGraph: {
      title: `${name}`,
      siteName: 'Grails',
      description: `${name} - Available on Grails`,
      url: `https://grails.app/${encodeURIComponent(name)}`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 418,
          alt: `${name} preview`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}`,
      description: `${name} - Available on Grails`,
      creator: '@grailsmarket',
      site: '@grailsmarket',
    },
  }
}

const Name = async (props: Props) => {
  const { name } = await props.params
  const decodedName = decodeURIComponent(name)
  const normalizedName = beautifyName(decodedName)

  if (!normalizedName.includes('.eth')) {
    return notFound()
  }

  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['name', 'details', normalizedName],
      queryFn: () => fetchNameDetails(normalizedName),
      staleTime: PREFETCH_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ['name', 'offers', normalizedName],
      queryFn: () => fetchNameOffers(normalizedName),
      staleTime: PREFETCH_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ['name', 'metadata', normalizedName],
      queryFn: async () => formatNameMetadata(await fetchNameMetadata(normalizedName)),
      staleTime: PREFETCH_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ['name', 'roles', normalizedName],
      queryFn: () => fetchNameRoles(normalizedName),
      staleTime: PREFETCH_STALE_TIME,
    }),
  ])

  const nameDetails = queryClient.getQueryData<MarketplaceDomainType>(['name', 'details', normalizedName])
  const nameOffers = queryClient.getQueryData<DomainOfferType[]>(['name', 'offers', normalizedName])
  const metadata = queryClient.getQueryData<MetadataType[]>(['name', 'metadata', normalizedName])
  const roles = queryClient.getQueryData<RolesType | null>(['name', 'roles', normalizedName])

  return (
    <main className='min-h-[calc(100dvh-56px)] w-full pb-4 sm:px-4 md:min-h-[calc(100dvh-78px)]'>
      <NameSemanticSummary
        name={normalizedName}
        details={nameDetails}
        offers={nameOffers}
        metadata={metadata}
        roles={roles}
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <NamePage name={normalizedName} />
      </HydrationBoundary>
    </main>
  )
}

export default Name
