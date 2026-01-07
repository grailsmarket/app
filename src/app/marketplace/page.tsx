import { Suspense } from 'react'
import MainPanel from './components/mainPanel'
import { FilterProvider } from '@/context/filters'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Find your next Grail on the Grails ENS Market',
  openGraph: {
    title: 'Marketplace | Grails',
    description: 'Find your next Grail on the Grails ENS Market',
    siteName: 'Marketplace',
    url: 'https://grails.app/marketplace',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace | Grails',
    description: 'Find your next Grail on the Grails ENS Market',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const Marketplace = () => {
  return (
    <Suspense>
      <FilterProvider filterType='marketplace'>
        <main className='min-h-screen'>
          <div className='relative z-10 mx-auto flex w-full flex-col'>
            <div className='bg-background relative flex min-h-[calc(100dvh-54px)] w-full flex-row gap-0 md:min-h-[calc(100dvh-70px)] lg:px-0'>
              <MainPanel />
            </div>
          </div>
        </main>
      </FilterProvider>
    </Suspense>
  )
}

export default Marketplace
