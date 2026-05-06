import { Metadata } from 'next'
import { Suspense } from 'react'
import Footer from '@/components/footer'
import ProHero from './components/proHero'
import ProSocialProof from './components/proSocialProof'
import ProFeatures from './components/proFeatures'
import ProPricing from './components/proPricing'
import ProComparisonTable from './components/proComparisonTable'
import ProFaq from './components/proFaq'
import ProCta from './components/proCta'

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
        <ProHero />
        <ProSocialProof />

        <div className='z-10 mx-auto flex w-full max-w-[1400px] flex-col items-center gap-20 px-4 pt-16 pb-8 sm:gap-28 sm:pt-24 sm:pb-12 md:gap-36 md:px-8 md:pt-32 lg:pt-40'>
          <ProFeatures />
          <div id='pricing' className='flex w-full flex-col items-center gap-10'>
            <ProPricing />
            <ProComparisonTable />
          </div>
          <ProFaq />
          <ProCta />
        </div>

        <Footer />
      </main>
    </Suspense>
  )
}

export default ProPage
