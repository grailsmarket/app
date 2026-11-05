import { createPublicClient, fallback, http } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'

export const createV2RecordsClient = () => {
  const rpcKey = activeChain.id === 1 ? config.alchemy.mainnet : config.alchemy.sepolia
  const network = activeChain.id === 1 ? 'eth-mainnet' : 'eth-sepolia'
  const options = { batch: true, timeout: 10_000, retryCount: 0 } as const
  const transport = rpcKey
    ? fallback([http(`https://${network}.g.alchemy.com/v2/${rpcKey}`, options), http(undefined, options)], {
        retryCount: 0,
      })
    : http(undefined, options)
  return createPublicClient({ chain: activeChain, transport })
}
