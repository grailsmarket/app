import { Suspense } from 'react'
import { Metadata } from 'next'
import LeaderboardList from './components/LeaderboardList'

export const metadata: Metadata = {
  title: 'Leaderboard',
  description: 'ENS leaderboard - top holders ranked by names owned, category names, and expired names',
  openGraph: {
    title: 'Leaderboard | Grails',
    description: 'ENS leaderboard - top holders ranked by names owned, category names, and expired names',
    siteName: 'Leaderboard',
    url: 'https://grails.app/leaderboard',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Leaderboard | Grails',
    description: 'ENS leaderboard - top holders ranked by names owned, category names, and expired names',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const LeaderboardPage = () => {
  return (
    <Suspense>
      <main className='min-h-screen w-full'>
        <div className='relative z-10 mx-auto flex w-full flex-col'>
          <div className='bg-background relative flex min-h-[calc(100dvh-54px)] w-full flex-col md:min-h-[calc(100dvh-70px)]'>
            <LeaderboardList />
          </div>
        </div>
      </main>
    </Suspense>
  )
}

export default LeaderboardPage
