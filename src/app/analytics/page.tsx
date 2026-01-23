import { Suspense } from 'react'
import { Metadata } from 'next'
import AnalyticsContent from './components/AnalyticsContent'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'ENS market analytics - top listings, offers, and sales charts',
  openGraph: {
    title: 'Analytics | Grails',
    description: 'ENS market analytics - top listings, offers, and sales charts',
    siteName: 'Analytics',
    url: 'https://grails.app/analytics',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Analytics | Grails',
    description: 'ENS market analytics - top listings, offers, and sales charts',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const AnalyticsPage = () => {
  return (
    <Suspense>
      <main className='min-h-screen w-full'>
        <div className='relative z-10 mx-auto flex w-full flex-col'>
          <div className='bg-background relative flex min-h-[calc(100dvh-54px)] w-full flex-col md:min-h-[calc(100dvh-70px)]'>
            <AnalyticsContent />
          </div>
        </div>
      </main>
    </Suspense>
  )
}

export default AnalyticsPage
