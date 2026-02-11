import {
  rabbyWallet,
  rainbowWallet,
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  walletConnectWallet,
  safeWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { mainnet, optimism, base } from 'wagmi/chains'
import { type Chain, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { http, fallback, createStorage, cookieStorage, createConfig } from 'wagmi'
import { APP_DESCRIPTION, APP_ICON, APP_NAME, APP_URL } from '@/constants'
import { safe } from 'wagmi/connectors'

coinbaseWallet.preference = 'all'
// Define the connectors for the app
// Purposely using only these for now because of a localStorage error with the Coinbase Wallet connector
const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [coinbaseWallet, injectedWallet],
    },
    {
      groupName: 'Popular',
      wallets: [rainbowWallet, metaMaskWallet, walletConnectWallet],
    },
    {
      groupName: 'Other',
      wallets: [rabbyWallet, safeWallet],
    },
  ],
  {
    appName: APP_NAME,
    projectId:
      process.env.WALLET_CONNECT_PROJECT_ID ||
      process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
      'd4f234136ca6a7efeed7abf93474125b',
    appDescription: APP_DESCRIPTION,
    appUrl: APP_URL,
    appIcon: APP_ICON,
  }
)

export type ChainWithDetails = Chain & {
  iconBackground?: string
  iconUrl?: string
  custom: {
    chainDetail?: string
    gasFeeDetail?: string
  }
}

// Define the chains for rainbow/wagmi and their respective icons
// These are the current supported chains for this app
// `chainDetail` and `gasFeeDetail` are custom fields to be used in the ChainList component
export const chains: [ChainWithDetails, ...ChainWithDetails[]] = [
  {
    ...mainnet,
    iconBackground: 'bg-zinc-300',
    iconUrl: '/chains/ethereum.svg',
    custom: {
      chainDetail: '',
      gasFeeDetail: 'High gas fees',
    },
    blockExplorers: {
      default: {
        name: 'Blockscout',
        url: 'https://explorer.base.org',
      },
      blockscout: {
        name: 'Blockscout',
        url: 'https://eth.blockscout.com/',
      },
    },
  },
  {
    ...base,
    iconUrl: '/chains/base.svg',
    custom: {
      chainDetail: 'Ethereum L2',
      gasFeeDetail: 'Super Low gas fees',
    },
    blockExplorers: {
      default: {
        name: 'Blockscout',
        url: 'https://explorer.base.org',
      },
      blockscout: {
        name: 'Blockscout',
        url: 'https://base.blockscout.com/',
      },
    },
  },
  {
    ...optimism,
    iconUrl: '/chains/optimism.svg',
    custom: {
      chainDetail: 'Ethereum L2',
      gasFeeDetail: 'Low gas fees',
    },
    blockExplorers: {
      default: {
        name: 'Blockscout',
        url: 'https://explorer.optimism.io',
      },
      blockscout: {
        name: 'Blockscout',
        url: 'https://optimistic.blockscout.com/',
      },
    },
  },
]

export const transports = {
  [mainnet.id]: fallback([
    http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_MAINNET_ALCHEMY_ID}`, {
      batch: true,
    }),
    http(`https://smart-cosmological-telescope.quiknode.pro/${process.env.NEXT_PUBLIC_QUICKNODE_ID}`, {
      batch: true,
    }),
    http('https://eth.llamarpc.com', {
      batch: true,
    }),
  ]),
  [optimism.id]: fallback([
    http(`https://opt-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_OPTIMISM_ALCHEMY_ID}`, {
      batch: true,
    }),
    http(`https://smart-cosmological-telescope.optimism.quiknode.pro/${process.env.NEXT_PUBLIC_QUICKNODE_ID}`, {
      batch: true,
    }),
    http(`https://mainnet.optimism.io`, {
      batch: true,
    }),
  ]),
  [base.id]: fallback([
    http(`https://base-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_BASE_ALCHEMY_ID}`, {
      batch: true,
    }),
    http(`https://smart-cosmological-telescope.base-mainnet.quiknode.pro/${process.env.NEXT_PUBLIC_QUICKNODE_ID}`, {
      batch: true,
    }),
    http('https://mainnet.base.org/', { batch: true }),
  ]),
}

const config = createConfig({
  ssr: true,
  connectors: [...connectors, safe()],
  chains,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports 
})

export default config
