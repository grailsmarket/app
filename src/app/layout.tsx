import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { Sedan_SC, Inter } from 'next/font/google'
import Providers from './providers'
import { Production } from './production'
import { sharedMetadata } from '@/lib/metadata'
import 'ethereum-identity-kit/css'
import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const sedanSC = Sedan_SC({
  variable: '--font-sedan-sc',
  weight: '400',
})

export const metadata: Metadata = sharedMetadata

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
        <Production>
          <Analytics />
          <SpeedInsights />
        </Production>
      </body>
    </html>
  )
}
