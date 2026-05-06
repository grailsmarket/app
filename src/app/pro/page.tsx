import { Metadata } from 'next'
import { Suspense } from 'react'
import Footer from '@/components/footer'
import ProPageShell from './components/proPageShell'

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
        <ProPageShell />
        <Footer />
      </main>
    </Suspense>
  )
}

export default ProPage
