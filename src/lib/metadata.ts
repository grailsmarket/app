import type { Metadata } from 'next'

export const metadataBaseUrl = new URL('https://grails.app')

export const metadataTitle = 'Grails Market'
export const metadataSiteName = 'Grails Market'
export const metadataDescription = 'Your ENS Market. Find, sell, buy, and manage your ENS names on Grails Market.'

export const sharedMetadataIcons: Metadata['icons'] = [
  {
    rel: 'icon',
    url: 'https://grails.app/favicon.ico',
  },
  {
    rel: 'apple-touch-icon',
    url: 'https://grails.app/apple-touch-icon.png',
  },
  {
    rel: 'android-chrome',
    url: 'https://grails.app/android-chrome-192x192.png',
  },
]

export const sharedMetadataOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  title: metadataTitle,
  description: metadataDescription,
  locale: 'en_US',
  siteName: metadataSiteName,
  url: 'https://grails.app',
  emails: ['contact@ethid.org'],
  images: [
    {
      url: 'https://grails.app/previews/home.jpeg',
    },
  ],
}

export const sharedMetadataTwitter: Metadata['twitter'] = {
  card: 'summary_large_image',
  site: '@grailsmarket',
  creator: '@grailsmarket',
  description: metadataDescription,
  images: [
    {
      url: 'https://grails.app/previews/home.jpeg',
    },
  ],
}

export const sharedMetadata: Metadata = {
  metadataBase: metadataBaseUrl,
  title: {
    default: metadataTitle,
    template: '%s | Grails',
  },
  description: metadataDescription,
  applicationName: metadataSiteName,
  keywords: [
    'Grails',
    'Grails Market',
    'Grails ENS Market',
    'Grails ENS',
    'Grails App',
    'Grails App Market',
    'Grails App Market',
  ],
  icons: sharedMetadataIcons,
  openGraph: sharedMetadataOpenGraph,
  authors: {
    name: 'EthID Org',
    url: 'https://ethid.org',
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    notranslate: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: metadataTitle,
    statusBarStyle: 'black-translucent',
    startupImage: 'https://grails.app/apple-touch-icon.png',
  },
}
