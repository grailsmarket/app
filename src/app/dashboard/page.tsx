import { Metadata } from 'next'
import { Suspense } from 'react'
import DashboardPage from './components/DashboardPage'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your customizable Grails dashboard — monitor domains, analytics, and activity in one place.',
  openGraph: {
    title: 'Dashboard | Grails',
    description: 'Your customizable Grails dashboard — monitor domains, analytics, and activity in one place.',
    siteName: 'Grails',
    url: 'https://grails.app/dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard | Grails',
    description: 'Your customizable Grails dashboard — monitor domains, analytics, and activity in one place.',
  },
}

const Dashboard = () => {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  )
}

export default Dashboard
