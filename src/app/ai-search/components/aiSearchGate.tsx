'use client'

import Link from 'next/link'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { FilterProvider } from '@/context/filters'
import PrimaryButton from '@/components/ui/buttons/primary'
import MainPanel from './mainPanel'

// PRO tier and above. Matches the gating pattern in DashboardPage.tsx.
const MIN_TIER_ID = 2

const AiSearchGate = () => {
  const { authStatus, authStatusIsLoading } = useUserContext()
  const { subscription } = useAppSelector(selectUserProfile)
  const { openConnectModal } = useConnectModal()

  const isAuthenticated = authStatus === 'authenticated'
  const isPro =
    subscription?.tierId != null &&
    subscription.tierId >= MIN_TIER_ID &&
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
          <h1 className='font-sedan-sc text-4xl'>AI Search</h1>
          <p className='text-neutral max-w-md text-lg'>Connect your wallet to search ENS names with AI.</p>
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
          <h1 className='font-sedan-sc text-4xl'>AI Search</h1>
          <p className='text-neutral max-w-md text-lg'>
            AI Search is available for Pro subscribers and above. Upgrade your plan to unlock it.
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

  return (
    <FilterProvider filterType='aiSearch'>
      <main className='min-h-screen'>
        <div className='relative z-10 mx-auto flex w-full flex-col'>
          <div className='bg-background relative flex min-h-[calc(100dvh-54px)] w-full flex-row gap-0 md:min-h-[calc(100dvh-70px)] lg:px-0'>
            <MainPanel />
          </div>
        </div>
      </main>
    </FilterProvider>
  )
}

export default AiSearchGate
