import { Suspense } from 'react'
import MainPanel from './components/mainPanel'
import { FilterProvider } from '@/context/filters'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bulk Search',
  description: 'Search for multiple ENS names at once on Grails',
  openGraph: {
    title: 'Bulk Search | Grails',
    description: 'Search for multiple ENS names at once on Grails',
    siteName: 'Bulk Search',
    url: 'https://grails.app/bulk-search',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bulk Search | Grails',
    description: 'Search for multiple ENS names at once on Grails',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const BulkSearch = () => {
  return (
    <Suspense>
      <FilterProvider filterType='bulkSearch'>
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

export default BulkSearch
