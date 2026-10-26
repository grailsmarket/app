'use client'

import { ProfileSkeleton, SettingsSkeleton } from '@/components/ui/ensSkeletons'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { isAddress, zeroAddress } from 'viem'
import { useUserContext } from '@/context/user'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import SignInButton from '@/components/ui/buttons/signInButton'
import { cn } from '@/utils/tailwind'
import { SettingsNavigationGuard } from './navigationGuard'
import ProfileSettings from './profileSettings'
import ResolverList from './resolverList'
import ResolverDetail from './resolverDetail'
import ConfigurationList from './configurationList'
import ConfigurationDetail from './configurationDetail'
import { SettingsNotice } from './shared'

const sections = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'resolvers', label: 'Resolvers' },
  { id: 'records', label: 'Records' },
]

interface SettingsPageProps {
  section: string[]
}

const Content: React.FC<SettingsPageProps> = ({ section }) => {
  const { profileIsLoading } = useUserContext()
  const [root = 'profile', resolver, id, tab] = section

  if ((root === 'profile' || root === 'notifications') && section.length <= 1)
    return profileIsLoading ? (
      <ProfileSkeleton notifications={root === 'notifications'} />
    ) : (
      <ProfileSettings notifications={root === 'notifications'} />
    )

  if (root === 'resolvers' && !resolver) return <ResolverList />
  if (root === 'records' && !resolver) return <ConfigurationList />

  if (resolver && isAddress(resolver, { strict: false }) && resolver.toLowerCase() !== zeroAddress) {
    if (root === 'resolvers' && !tab && (!id || ['names', 'permissions'].includes(id)))
      return <ResolverDetail resolver={resolver} tab={id} />
    if (root === 'records' && id === 'new' && !tab)
      return <ConfigurationDetail resolver={resolver} id={BigInt(0)} mode='new' />
    if (
      root === 'records' &&
      /^\d+$/.test(id ?? '') &&
      section.length <= 4 &&
      (!tab || ['names', 'duplicate'].includes(tab))
    )
      return (
        <ConfigurationDetail
          resolver={resolver}
          id={BigInt(id)}
          tab={tab === 'names' ? tab : 'records'}
          mode={tab === 'duplicate' ? 'copy' : 'edit'}
        />
      )
  }

  return (
    <SettingsNotice error>
      This settings page does not exist.{' '}
      <Link href='/settings' className='underline'>
        Return to settings
      </Link>
      .
    </SettingsNotice>
  )
}

const SettingsPage: React.FC<SettingsPageProps> = ({ section }) => {
  const { userAddress, authStatus, authStatusIsLoading } = useUserContext()
  const selected = section[0] || 'profile'
  const navigation = useRef<HTMLElement>(null)

  useEffect(() => {
    const active = navigation.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (active && navigation.current)
      navigation.current.scrollLeft = Math.max(0, active.offsetLeft - navigation.current.offsetLeft - 16)
  }, [selected, authStatus])

  return (
    <main className='mx-auto w-full max-w-7xl px-3 py-3 md:px-8 md:py-8'>
      {authStatusIsLoading ? (
        <SettingsSkeleton section={selected} />
      ) : !userAddress || authStatus !== 'authenticated' ? (
        <div className='flex flex-col items-start gap-5'>
          <p className='text-neutral text-lg'>Sign in to manage settings for your wallet.</p>
          <SignInButton />
        </div>
      ) : (
        <SettingsTransactionProvider key={userAddress}>
          <SettingsNavigationGuard>
            <div className='flex min-w-0 flex-col gap-4 md:flex-row md:gap-6 xl:gap-8'>
              <nav
                ref={navigation}
                aria-label='Settings sections'
                className='border-tertiary flex shrink-0 overflow-x-auto md:h-[calc(100vh-160px)] md:w-48 md:flex-col md:gap-2 md:border-r md:pr-6 md:pb-4'
              >
                <h1 className='mb-2 hidden pt-2 text-3xl font-bold md:block'>Settings</h1>

                {sections.map((item) => (
                  <Link
                    key={item.id}
                    href={`/settings/${item.id}`}
                    aria-current={selected === item.id ? 'page' : undefined}
                    className={cn(
                      'border-tertiary flex-1 shrink-0 border-b-2 px-2 py-2 text-center text-lg font-semibold whitespace-nowrap transition-colors md:flex-none md:rounded-sm md:border-b-0 md:px-3 md:text-left',
                      selected === item.id
                        ? 'border-primary text-primary md:bg-secondary font-bold md:font-semibold'
                        : 'text-neutral hover:border-foreground hover:text-foreground md:hover:bg-secondary'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className='min-w-0 flex-1'>
                <Content key={section.join('/')} section={section} />
              </div>
            </div>
          </SettingsNavigationGuard>
        </SettingsTransactionProvider>
      )}
    </main>
  )
}

export default SettingsPage
