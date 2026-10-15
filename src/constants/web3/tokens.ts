import { config } from '@/lib/config'
import { Address } from 'viem'
import usdc from 'public/tokens/usdc.svg'
import dai from 'public/tokens/dai.svg'

export const WETH_ADDRESS = config.wethAddress
export const USDC_ADDRESS = config.usdcAddress
export const DAI_ADDRESS = config.daiAddress
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' as Address // Mainnet
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' // Mainnet
export const ENS_ADDRESS = config.ensAddress

export const TOKENS = {
  [WETH_ADDRESS]: 'WETH',
  [USDC_ADDRESS]: 'USDC',
  [ETH_ADDRESS]: 'ETH',
  [ENS_ADDRESS]: 'ENS',
  [DAI_ADDRESS]: 'DAI',
} as const

export const TOKEN_ADDRESSES = {
  WETH: WETH_ADDRESS,
  USDC: USDC_ADDRESS,
  ETH: ETH_ADDRESS,
  ENS: ENS_ADDRESS,
  DAI: DAI_ADDRESS,
} as const

// Token decimals
export const TOKEN_DECIMALS = {
  ETH: 18,
  WETH: 18,
  USDC: 6,
  ENS: 18,
  DAI: 18,
} as const

export const MAX_ETH_SUPPLY = 120700000

export const registrationAssets = [
  {
    value: USDC_ADDRESS,
    label: 'USDC',
    icon: usdc,
  },
  {
    value: DAI_ADDRESS,
    label: 'DAI',
    icon: dai,
  },
]
