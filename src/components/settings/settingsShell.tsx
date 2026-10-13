'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import type { ReactNode } from 'react'
import PendingTransactions from '@/components/ens-v2/pendingTransactions'
import { buttonClass } from '@/components/ens-v2/ui'

const sections = [
  ['profile', 'Profile details'],
  ['notifications', 'Notifications'],
  ['resolvers', 'Resolvers'],
  ['records', 'Records'],
] as const

export default function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { userAddress, authStatus, handleSignIn } = useUserContext()
  const { openConnectModal } = useConnectModal()
  return (
    <main className='mx-auto min-h-[70vh] max-w-6xl px-4 py-8 md:px-8'>
      <h1 className='font-sedan-sc mb-8 text-4xl'>Settings</h1>
      <div className='flex flex-col gap-8 md:flex-row'>
        <nav aria-label='Settings sections' className='flex gap-1 overflow-x-auto md:w-48 md:shrink-0 md:flex-col'>
          {sections.map(([path, label]) => (
            <Link
              key={path}
              href={`/settings/${path}`}
              aria-current={pathname.startsWith(`/settings/${path}`) ? 'page' : undefined}
              className={`rounded-md px-4 py-3 whitespace-nowrap ${pathname.startsWith(`/settings/${path}`) ? 'bg-secondary text-primary' : 'text-neutral hover:bg-secondary'}`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className='min-w-0 flex-1' key={userAddress}>
          {authStatus === 'authenticated' && userAddress ? (
            <>
              <div className='mb-5 flex flex-col gap-3'>
                <PendingTransactions />
              </div>
              {children}
            </>
          ) : (
            <div className='border-tertiary flex flex-col items-start gap-4 rounded-lg border p-6'>
              <p>Sign in with your wallet to manage your settings.</p>
              <button className={buttonClass} onClick={() => (userAddress ? handleSignIn() : openConnectModal?.())}>
                {userAddress ? 'Sign in' : 'Connect wallet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
