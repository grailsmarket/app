import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import NamePage from './components/name'
import ClientOnly from './components/ClientOnly'
import HideOnClient from './components/HideOnClient'
import ServerPanels from './components/serverPanels'
import { beautifyName } from '@/lib/ens'
import { notFound } from 'next/navigation'
import { fetchNameDetails } from '@/api/name/details'
import { fetchNameOffers } from '@/api/name/offers'
import { fetchNameRoles } from '@/api/name/roles'
import { ONE_MINUTE } from '@/constants/time'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import { RolesType } from '@/types/api'

interface Props {
  params: Promise<{ name: string }>
  searchParams: Promise<SearchParams>
}

const PREFETCH_STALE_TIME = 3 * ONE_MINUTE * 1000

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
    // queryClient.prefetchQuery({
    //   queryKey: ['name', 'offers', normalizedName],
    //   queryFn: () => fetchNameOffers(normalizedName),
    //   staleTime: PREFETCH_STALE_TIME,
    // }),
    // queryClient.prefetchQuery({
    //   queryKey: ['name', 'roles', normalizedName],
    //   queryFn: () => fetchNameRoles(normalizedName),
    //   staleTime: PREFETCH_STALE_TIME,
    // }),
  ])

  const nameDetails = queryClient.getQueryData<MarketplaceDomainType>(['name', 'details', normalizedName])
  // const nameOffers = queryClient.getQueryData<DomainOfferType[]>(['name', 'offers', normalizedName])
  // const roles = queryClient.getQueryData<RolesType | null>(['name', 'roles', normalizedName])

  return (
    <main className='min-h-[calc(100dvh-56px)] w-full pb-4 sm:px-4 md:min-h-[calc(100dvh-78px)]'>
      <HideOnClient>
        <ServerPanels name={normalizedName} nameDetails={nameDetails} offers={[]} metadata={[]} roles={null} />
      </HideOnClient>
      <ClientOnly>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <NamePage name={normalizedName} />
        </HydrationBoundary>
      </ClientOnly>
    </main>
  )
}

export default Name
