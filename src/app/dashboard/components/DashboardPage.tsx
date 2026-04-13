'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { setSidebarOpen } from '@/state/reducers/dashboard'
import { selectDashboardSidebarOpen } from '@/state/reducers/dashboard/selectors'
import DashboardGrid from './DashboardGrid'
import DashboardSidebar from './DashboardSidebar'
import LayoutSelector from './LayoutSelector'
import { DashboardActivityProvider } from '../context/DashboardActivityProvider'
import { useDashboardAutoSave } from '../hooks/useDashboardAutoSave'
import PrimaryButton from '@/components/ui/buttons/primary'
import Plus from 'public/icons/plus.svg'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'

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
  const dispatch = useAppDispatch()
  const { isNavbarVisible } = useNavbar()
  const sidebarOpen = useAppSelector(selectDashboardSidebarOpen)
  useDashboardAutoSave()

  return (
    <DashboardActivityProvider>
      <main className='relative flex min-h-screen flex-col'>
        <div className={cn('px-md py-md sm:px-lg border-tertiary flex items-center justify-between gap-3 border-b-2 sticky top-0 bg-background z-10 transition-all duration-300', isNavbarVisible ? 'top-14 md:top-[72px]' : 'top-0')}>
          <button
            onClick={() => dispatch(setSidebarOpen(!sidebarOpen))}
            className={cn(
              'border-tertiary hover:bg-secondary text-md flex h-10 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 font-medium transition-colors',
              sidebarOpen && 'bg-primary/10 border-primary/40 text-primary'
            )}
          >
            <Image
              src={Plus}
              alt='plus'
              height={16}
              width={16}
              className={cn('transition-transform', sidebarOpen && 'rotate-45')}
            />
            <p>Widgets</p>
          </button>
          <LayoutSelector />
        </div>
        <div className='relative flex flex-1'>
          <DashboardSidebar />
          <div className='w-full overflow-x-hidden px-2 pb-8 sm:px-4'>
            <DashboardGrid />
          </div>
        </div>
      </main>
    </DashboardActivityProvider>
  )
}

export default DashboardPage
