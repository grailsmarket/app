import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { cache } from 'react'
import NamePage from './components/name'
import ClientOnly from './components/ClientOnly'
import HideOnClient from './components/HideOnClient'
import ServerPanels from './components/serverPanels'
import { beautifyName } from '@/lib/ens'
import { notFound } from 'next/navigation'
import { fetchNameDetails } from '@/api/name/details'

interface Props {
  params: Promise<{ name: string }>
  searchParams: Promise<SearchParams>
}

// Share details between metadata and rendering within this request, without caching mutable token IDs across requests.
const getNameDetails = cache(fetchNameDetails)

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const params = await props.params
  const name = beautifyName(decodeURIComponent(params.name))
  const details = await getNameDetails(name)
  const imageParams = new URLSearchParams({ name })

  if (details.id > 0 && details.token_id) {
    imageParams.set('tokenId', details.token_id)
  }

  const imageUrl = `https://grails.app/api/og/name?${imageParams.toString()}`

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
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 418,
          alt: `${name} preview`,
        },
      ],
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

  const nameDetails = await getNameDetails(normalizedName)
  const queryClient = new QueryClient()
  queryClient.setQueryData(['name', 'details', normalizedName], nameDetails)

  return (
    <main className='min-h-[calc(100dvh-56px)] w-full pb-4 md:min-h-[calc(100dvh-78px)] @[40rem]/app:px-4'>
      <HideOnClient>
        <ServerPanels name={normalizedName} nameDetails={nameDetails} />
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
