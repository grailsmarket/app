'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import TicketList from './TicketList'
import TicketDetail from './TicketDetail'
import CreateTicketForm from './CreateTicketForm'

type View = 'list' | 'create' | { ticketId: number }

const SupportPage = () => {
  const { authStatus, authStatusIsLoading } = useUserContext()
  const { subscription } = useAppSelector(selectUserProfile)
  const { openConnectModal } = useConnectModal()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ticketParam = searchParams.get('ticket')
  const ticketParamId = ticketParam ? parseInt(ticketParam) : null

  const [view, setView] = useState<View>(
    ticketParamId && Number.isFinite(ticketParamId) ? { ticketId: ticketParamId } : 'list'
  )

  // Sync ?ticket=… changes (e.g. user clicks a different notification) with the view.
  useEffect(() => {
    if (ticketParamId && Number.isFinite(ticketParamId)) {
      setView((prev) =>
        typeof prev === 'object' && prev.ticketId === ticketParamId ? prev : { ticketId: ticketParamId }
      )
    }
  }, [ticketParamId])

  const goToList = () => {
    setView('list')
    if (ticketParam) router.replace(pathname)
  }

  const isAuthenticated = authStatus === 'authenticated'
  const tier = subscription?.tier
  const tierExpired =
    subscription?.tierExpiresAt && new Date(subscription.tierExpiresAt) < new Date()
  const hasAccess = !!tier && tier !== 'free' && !tierExpired

  if (authStatusIsLoading) {
    return (
      <main className='flex min-h-screen items-center justify-center'>
        <div className='border-primary h-10 w-10 animate-spin rounded-full border-b-2' />
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center gap-6 px-4'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h1 className='font-sedan-sc text-4xl'>Support</h1>
          <p className='text-neutral max-w-md text-lg'>
            Connect your wallet to file or view support tickets.
          </p>
        </div>
        <PrimaryButton onClick={() => openConnectModal?.()} className='px-8 text-lg'>
          Connect Wallet
        </PrimaryButton>
      </main>
    )
  }

  if (!hasAccess) {
    return (
      <main className='flex min-h-screen flex-col items-center justify-center gap-6 px-4'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <h1 className='font-sedan-sc text-4xl'>Support</h1>
          <p className='text-neutral max-w-md text-lg'>
            Direct support is included with any paid Grails subscription. Upgrade your plan to
            open tickets and get help from our team.
          </p>
        </div>
        <Link
          href='/pro'
          className='bg-primary text-background hover:bg-primary/90 rounded-md px-8 py-2.5 text-lg font-semibold transition-colors'
        >
          See subscription plans
        </Link>
      </main>
    )
  }

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 md:py-12'>
      <header className='flex items-end justify-between gap-4'>
        <div>
          <h1 className='font-sedan-sc text-4xl md:text-5xl'>Support</h1>
          <p className='text-neutral mt-1 text-base md:text-lg'>
            Report a bug or open a ticket. We&apos;ll reply in-app and via email.
          </p>
        </div>
        {view === 'list' && (
          <PrimaryButton onClick={() => setView('create')}>New ticket</PrimaryButton>
        )}
        {view !== 'list' && (
          <SecondaryButton onClick={goToList}>Back to tickets</SecondaryButton>
        )}
      </header>

      {view === 'list' && <TicketList onOpenTicket={(ticketId) => setView({ ticketId })} />}
      {view === 'create' && (
        <CreateTicketForm
          onCreated={(ticketId) => setView({ ticketId })}
          onCancel={goToList}
        />
      )}
      {typeof view === 'object' && (
        <TicketDetail ticketId={view.ticketId} onBack={goToList} />
      )}
    </main>
  )
}

export default SupportPage
