import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { fetchAccount, fetchProfileDetails, fetchProfileStats, isLinkValid, truncateAddress } from 'ethereum-identity-kit/utils'
import { isAddress, isHex } from 'viem'
import { ONE_MINUTE } from '@/constants/time'
import Profile from './components/profile'

interface Props {
  params: Promise<{ user: string }>
  searchParams: Promise<SearchParams>
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

  const ensData = await getAccount()
  const ensName = ensData?.ens?.name
  const ensAvatar = ensData?.ens?.avatar
  const displayUser = ensName || truncatedUser
  // @ts-expect-error the records do exist
  const description = ensData?.ens?.records?.description

  const avatarResponse = ensAvatar && isLinkValid(ensAvatar) ? await fetch(ensAvatar) : null

  const pageUrl = `https://grails.app/profile/${user}`
  const ogImageUrl = `https://grails.app/profile/og?user=${user}`

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
    icons: avatarResponse?.status === 200 ? ensAvatar : '@/app/favicon.ico',
    appleWebApp: {
      capable: true,
      title: displayUser,
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
    await queryClient.prefetchQuery({
      queryKey: ['profile', user],
      queryFn: () => (user ? fetchProfileDetails(user, listNum) : null),
      staleTime: 3 * ONE_MINUTE * 1000,
    })

    await queryClient.prefetchQuery({
      queryKey: ['stats', user],
      queryFn: () => (user ? fetchProfileStats(user, listNum) : null),
      staleTime: 3 * ONE_MINUTE * 1000,
    })
  }

  return (
    <main className='min-h-screen w-full' style={{ minHeight: 'calc(100vh - 360px)' }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Profile user={user} />
      </HydrationBoundary>
    </main>
  )
}

export default UserPage

