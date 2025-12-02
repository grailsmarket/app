import { Metadata } from 'next'
import Portfolio from './portfolio'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Manage your ENS portfolio on Grails',
  openGraph: {
    title: 'Portfolio | Grails',
    description: 'Manage your ENS portfolio on Grails',
    siteName: 'Portfolio',
    url: 'https://grails.app/portfolio',
    images: [{ url: 'https://grails.app/banners/portfolio.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Portfolio | Grails',
    description: 'Manage your ENS portfolio on Grails',
    images: 'https://grails.app/banners/portfolio.jpeg',
  },
}

const PortfolioPage = () => {
  return <Portfolio />
}

export default PortfolioPage
