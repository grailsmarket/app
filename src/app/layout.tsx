import type { Metadata } from 'next'
import { Sedan_SC, Inter } from 'next/font/google'
import './globals.css'
import 'ethereum-identity-kit/css'
import '@rainbow-me/rainbowkit/styles.css'
import Providers from './providers'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const sedanSC = Sedan_SC({
  variable: '--font-sedan-sc',
  weight: '400',
})

export const metadata: Metadata = {
  title: 'Grails Market',
  description: 'Find your next Grail on the Grails ENS Market',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' className='dark'>
      <body className={`${inter.variable} ${sedanSC.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
