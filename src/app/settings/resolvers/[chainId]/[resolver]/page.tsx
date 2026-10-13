import { isAddress } from 'viem'
import { notFound } from 'next/navigation'
import ResolverDetail from '@/components/ens-v2/resolverDetail'
import { activeChain } from '@/constants/web3/chain'

export default async function ResolverPage({
  params,
  searchParams,
}: {
  params: Promise<{ chainId: string; resolver: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { chainId, resolver } = await params
  if (!isAddress(resolver)) notFound()
  if (Number(chainId) !== activeChain.id)
    return <p>This resolver belongs to another network. Open Grails on that network to manage it.</p>
  const { tab } = await searchParams
  return (
    <ResolverDetail resolver={resolver} initialTab={tab === 'names' || tab === 'access' ? tab : 'configurations'} />
  )
}
