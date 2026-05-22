import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import NamePage from './components/name'
import ClientOnly from './components/ClientOnly'
import HideOnClient from './components/HideOnClient'
import ServerPanels from './components/serverPanels'
import { beautifyName } from '@/lib/ens'
import { notFound } from 'next/navigation'
import { fetchNameBundle } from '@/api/name/bundle'
import { formatNameMetadata } from '@/api/name/metadata'

interface Props {
  params: Promise<{ name: string }>
  searchParams: Promise<SearchParams>
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

  const bundle = await fetchNameBundle(normalizedName)
  const metadata = formatNameMetadata(bundle.details.metadata)

  queryClient.setQueryData(['name', 'details', normalizedName], bundle.details)
  queryClient.setQueryData(['name', 'offers', normalizedName], bundle.offers)
  queryClient.setQueryData(['name', 'roles', normalizedName], bundle.roles)
  queryClient.setQueryData(['name', 'metadata', normalizedName], metadata)

  return (
    <main className='min-h-[calc(100dvh-56px)] w-full pb-4 sm:px-4 md:min-h-[calc(100dvh-78px)]'>
      <HideOnClient>
        <ServerPanels
          name={normalizedName}
          nameDetails={bundle.details}
          offers={bundle.offers}
          metadata={metadata}
          roles={bundle.roles}
        />
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
