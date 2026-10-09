import { mainnet, sepolia } from 'viem/chains'

const isSepolia = process.env.NEXT_PUBLIC_CHAIN_ID === String(sepolia.id)

export const activeChain = isSepolia ? sepolia : mainnet
export const ENS_NETWORK = isSepolia ? 'sepolia' : 'mainnet'
export const ENS_APP_URL = isSepolia ? 'https://sepolia.app.ens.domains' : 'https://app.ens.domains'
export const EXPLORER_URL = activeChain.blockExplorers.default.url
