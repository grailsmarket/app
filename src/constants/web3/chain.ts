// Active chain for ENS

import { config } from '@/lib/config'
import { mainnet, sepolia } from 'viem/chains'

const availableChains = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
}

const activeChainId = config.publicChainId
export const activeChain = availableChains[activeChainId] || mainnet
