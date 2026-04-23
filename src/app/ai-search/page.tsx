import { Suspense } from 'react'
import AiSearchGate from './components/aiSearchGate'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Search',
  description: 'Search ENS names with AI semantic search on Grails',
  openGraph: {
    title: 'AI Search | Grails',
    description: 'Search ENS names with AI semantic search on Grails',
    siteName: 'AI Search',
    url: 'https://grails.app/ai-search',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Search | Grails',
    description: 'Search ENS names with AI semantic search on Grails',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const AiSearch = () => {
  return (
    <Suspense>
      <AiSearchGate />
    </Suspense>
  )
}

export default AiSearch
