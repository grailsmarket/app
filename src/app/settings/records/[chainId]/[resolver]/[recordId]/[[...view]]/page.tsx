import { isAddress } from 'viem'
import { notFound } from 'next/navigation'
import ConfigurationDetail from '@/components/ens-v2/configurationDetail'
import { activeChain } from '@/constants/web3/chain'
import { uint256 } from '@/utils/web3/resolver-records'

export default async function ConfigurationPage({
  params,
}: {
  params: Promise<{ chainId: string; resolver: string; recordId: string; view?: string[] }>
}) {
  const { chainId, resolver, recordId, view } = await params
  if (!isAddress(resolver) || !/^[1-9][0-9]*$/.test(recordId) || (view && (view.length !== 1 || view[0] !== 'names')))
    notFound()
  try {
    uint256(recordId)
  } catch {
    notFound()
  }
  if (Number(chainId) !== activeChain.id) return <p>This configuration belongs to another network.</p>
  return (
    <ConfigurationDetail resolver={resolver} recordId={recordId} tab={view?.[0] === 'names' ? 'names' : 'records'} />
  )
}
