import { Metadata } from 'next'
import { Suspense } from 'react'
import Footer from '@/components/footer'
import ProPageContent from './components/proPageContent'
import AdvancedTools from './components/advancedBulkTools'

export const metadata: Metadata = {
  title: 'Grails Pro',
  description: 'Unlock premium features with Grails Pro subscriptions',
  openGraph: {
    title: 'Grails Pro',
    description: 'Unlock premium features with Grails Pro subscriptions',
    siteName: 'Grails',
    url: 'https://grails.app/pro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grails Pro',
    description: 'Unlock premium features with Grails Pro subscriptions',
  },
}

const ProPage = () => {
  return (
    <Suspense>
      <main className='relative min-h-screen'>
        {/* Hero */}
        <div className='flex flex-col items-center gap-4 text-center sm:pt-4 lg:pt-8'>
          <h1 className='font-sedan-sc text-6xl sm:text-8xl'>
            Do more, with Grails <span className='text-primary'>Pro</span>
          </h1>
          <p className='text-neutral max-w-xl text-xl md:text-2xl'>
            Supercharge your ENS experience with premium tools, analytics, and exclusive access.
          </p>
        </div>

        <div className='z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center gap-12 px-4 pt-12 pb-8 md:gap-20 md:px-8 lg:pt-8'>
          <AdvancedTools />
          <ProPageContent />
        </div>
        <Footer />
      </main>
    </Suspense>
  )
}

export default ProPage
