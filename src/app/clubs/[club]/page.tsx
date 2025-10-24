import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import ClubPage from './components/club'

interface Props {
  params: Promise<{ club: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const club = params.club

  return {
    title: `${club} Club | Grails`,
    description: `${club}`,
    openGraph: {
      title: `${club} Club | Grails`,
      siteName: `${club} Club | Grails`,
      description: `${club}`,
      url: `https://grails.app/clubs/${club}`,
      images: [{ url: `https://grails.app/clubs/og?club=${club}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${club}`,
      description: `${club}`,
      images: `https://grails.app/clubs/og?club=${club}`,
    },
  }
}

const UserPage = async (props: Props) => {
  const { club } = await props.params
  const queryClient = new QueryClient()

  return (
    <main className='min-h-screen w-full' style={{ minHeight: 'calc(100vh - 360px)' }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ClubPage club={club} />
      </HydrationBoundary>
    </main>
  )
}

export default UserPage
