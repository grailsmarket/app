'use client'

import Link from 'next/link'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import DashboardGrid from './DashboardGrid'
import DashboardSidebar from './DashboardSidebar'
import { DashboardActivityProvider } from '../context/DashboardActivityProvider'
import { useDashboardSync } from '../hooks/useDashboardSync'
import PrimaryButton from '@/components/ui/buttons/primary'

const DashboardPage = () => {
  const { authStatus, authStatusIsLoading } = useUserContext()
  const { subscription } = useAppSelector(selectUserProfile)
  const { openConnectModal } = useConnectModal()

  const isAuthenticated = authStatus === 'authenticated'
  const isPro =
    subscription?.tierId != null &&
    subscription.tierId >= 2 &&
    (!subscription.tierExpiresAt || new Date(subscription.tierExpiresAt) > new Date())

  if (authStatusIsLoading) {
    return (
      <main className='flex min-h-screen items-center justify-center'>
        <div className='border-primary h-10 w-10 animate-spin rounded-full border-b-2' />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h1 className='font-sedan-sc text-4xl'>Dashboard</h1>
          <p className='text-neutral max-w-md text-lg'>Connect your wallet to access your customizable dashboard.</p>
        </div>
        <PrimaryButton onClick={() => openConnectModal?.()} className='px-8 text-lg'>
          Connect Wallet
        </PrimaryButton>
      </main>
    )
  }

  if (!isPro) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h1 className='font-sedan-sc text-4xl'>Dashboard</h1>
          <p className='text-neutral max-w-md text-lg'>
            The dashboard is available for Pro subscribers and above. Upgrade your plan to unlock it.
          </p>
        </div>
        <Link
          href='/pro'
          className='bg-primary text-background hover:bg-primary/90 rounded-md px-8 py-2.5 text-lg font-semibold transition-colors'
        >
          Get Pro
        </Link>
      </main>
    )
  }

  return <AuthenticatedDashboard />
}

const AuthenticatedDashboard = () => {
  useDashboardSync()

  return (
    <DashboardActivityProvider>
      <main className='relative flex min-h-screen'>
        <DashboardSidebar />
        <div className='flex-1 overflow-x-hidden px-2 pt-2 pb-8 sm:px-4'>
          <DashboardGrid />
        </div>
      </main>
    </DashboardActivityProvider>
  )
}

export default DashboardPage
