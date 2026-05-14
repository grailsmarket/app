import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import {
  fetchAccount,
  fetchProfileDetails,
  fetchProfileStats,
  isLinkValid,
  truncateAddress,
} from 'ethereum-identity-kit/utils'
import { isAddress, isHex } from 'viem'
import { ONE_MINUTE } from '@/constants/time'
import Profile from './components/profile'

type ProfileDetails = Awaited<ReturnType<typeof fetchProfileDetails>>

interface Props {
  params: Promise<{ user: string }>
  searchParams: Promise<SearchParams>
}

const PREFETCH_STALE_TIME = 3 * ONE_MINUTE * 1000

const fetchPublicAccount = async (user: string) => {
  const account = await fetchAccount(user)

  if (!account?.address) {
    if (isAddress(user)) {
      return {
        address: user,
        ens: null,
        primary_list: null,
      }
    }

    return null
  }

  return account
}

const ProfileSemanticSummary = ({
  user,
  profile,
  account,
}: {
  user: string
  profile?: ProfileDetails
  account?: Awaited<ReturnType<typeof fetchPublicAccount>>
}) => {
  const ens = profile?.ens || account?.ens
  const address = profile?.address || account?.address
  const displayName = ens?.name || (address ? truncateAddress(address) : user)
  const description = ens?.records?.description
  const primaryList = profile?.primary_list || account?.primary_list

  return (
    <section
      aria-labelledby='profile-summary-title'
      className='bg-secondary border-tertiary w-full border-b-2 p-4 text-sm sm:p-5'
    >
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-3 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <p className='text-neutral text-lg font-medium'>Grails profile</p>
          <h1 id='profile-summary-title' className='truncate text-3xl font-bold md:text-4xl'>
            {displayName}
          </h1>
          {description && <p className='text-neutral mt-2 max-w-3xl text-lg'>{description}</p>}
        </div>
        {primaryList && (
          <p className='bg-tertiary w-fit rounded-sm px-3 py-1 text-lg font-semibold'>List #{primaryList}</p>
        )}
      </div>
      <dl className='mx-auto mt-4 grid w-full max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>Address</dt>
          <dd className='font-mono text-lg font-semibold'>{address ? truncateAddress(address) : 'Unknown'}</dd>
        </div>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>ENS</dt>
          <dd className='text-lg font-semibold'>{ens?.name || 'None found'}</dd>
        </div>
        <div className='border-neutral border-l-2 pl-3'>
          <dt className='text-neutral text-lg font-medium'>Profile route</dt>
          <dd className='text-lg font-semibold break-all'>/profile/{user}</dd>
        </div>
      </dl>
    </section>
  )
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const user = isAddress(params.user) ? params.user : params.user
  const searchParams = await props.searchParams
  const ssr = searchParams.ssr === 'false' ? false : true
  const truncatedUser = isAddress(params.user) ? (truncateAddress(params.user) as string) : params.user

  const getAccount = async () => {
    try {
      if (ssr) {
        return await fetchAccount(user)
      }

      return null
    } catch (error) {
      console.error(error)
      return null
    }
  }

  const fetchAvatar = async (avatar: string) => {
    try {
      if (ssr) {
        const response = await fetch(avatar)
        if (response.status === 200) {
          return response
        }
      }

      return false
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const ensData = await getAccount()
  const ensName = ensData?.ens?.name
  const ensAvatar = ensData?.ens?.avatar
  const displayUser = ensName || truncatedUser
  const description = ensData?.ens?.records?.description

  const avatarResponse = ensAvatar && isLinkValid(ensAvatar) ? await fetchAvatar(ensAvatar) : false

  const pageUrl = `https://grails.app/profile/${user}`
  const ogImageUrl = `https://grails.app/api/og/profile?user=${user}`

  return {
    title: `${displayUser}`,
    description,
    openGraph: {
      title: `${displayUser}`,
      siteName: `${displayUser}`,
      description,
      url: pageUrl,
      images: [{ url: ogImageUrl }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayUser}`,
      description,
      images: ogImageUrl,
    },
    icons: avatarResponse ? ensAvatar : '@/app/favicon.ico',
    appleWebApp: {
      capable: true,
      title: displayUser,
      // startupImage: avatarResponse ? ensAvatar : '/assets/apple-touch-icon.png',
    },
  }
}

const UserPage = async (props: Props) => {
  const { user } = await props.params
  const searchParams = await props.searchParams
  const ssr = searchParams.ssr === 'false' ? false : true

  const isList = Number.isInteger(Number(user)) && !(isAddress(user) || isHex(user))
  const listNum = isList ? Number(user) : undefined

  const queryClient = new QueryClient()

  // Skip prefetching if ssr is false
  if (ssr) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['profile', user, undefined, false, undefined],
        queryFn: () => (user ? fetchProfileDetails(user, listNum) : null),
        staleTime: PREFETCH_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: ['stats', user, undefined, false, undefined],
        queryFn: () => (user ? fetchProfileStats(user, listNum) : null),
        staleTime: PREFETCH_STALE_TIME,
      }),
      queryClient.prefetchQuery({
        queryKey: ['account', user],
        queryFn: () => fetchPublicAccount(user),
        staleTime: PREFETCH_STALE_TIME,
      }),
    ])
  }

  const profile = queryClient.getQueryData<ProfileDetails>(['profile', user, undefined, false, undefined])
  const account = queryClient.getQueryData<Awaited<ReturnType<typeof fetchPublicAccount>>>(['account', user])

  return (
    <main className='min-h-screen w-full'>
      <ProfileSemanticSummary user={user} profile={profile} account={account} />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Profile user={user} />
      </HydrationBoundary>
    </main>
  )
}

export default UserPage
