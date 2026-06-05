import { Suspense } from 'react'
import { Metadata } from 'next'
import Feed from './components/feed'
import { FilterProvider } from '@/context/filters'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Comments Feed',
  description: 'Live ENS comments feed across Grails',
  openGraph: {
    title: 'Comments Feed | Grails',
    description: 'Live ENS comments feed across Grails',
    siteName: 'Grails',
    url: 'https://grails.app/feed',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Comments Feed | Grails',
    description: 'Live ENS comments feed across Grails',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const FeedPage = () => {
  return (
    <Suspense>
      <main className='min-h-screen w-full'>
        <div className='relative z-10 mx-auto flex w-full flex-col'>
          <div className='bg-background relative flex min-h-[calc(100dvh-54px)] w-full flex-col md:min-h-[calc(100dvh-70px)]'>
            <FilterProvider filterType='feed'>
              <Feed />
            </FilterProvider>
          </div>
        </div>
      </main>
    </Suspense>
  )
}

export default FeedPage
