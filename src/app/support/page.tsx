import { Metadata } from 'next'
import { Suspense } from 'react'
import SupportPage from './components/SupportPage'

export const metadata: Metadata = {
  title: 'Support',
  description: 'Open and track support tickets with the Grails team.',
  openGraph: {
    title: 'Support | Grails',
    description: 'Open and track support tickets with the Grails team.',
    siteName: 'Grails',
    url: 'https://grails.app/support',
  },
  twitter: {
    card: 'summary',
    title: 'Support | Grails',
    description: 'Open and track support tickets with the Grails team.',
  },
}

const Page = () => {
  return (
    <Suspense>
      <SupportPage />
    </Suspense>
  )
}

export default Page
