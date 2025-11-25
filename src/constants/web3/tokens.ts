export const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // Mainnet
export const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // Mainnet
export const ETH_ADDRESS = '0x0000000000000000000000000000000000000000' // Mainnet
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' // Mainnet

export const TOKENS = {
  [WETH_ADDRESS]: 'WETH',
  [USDC_ADDRESS]: 'USDC',
  [ETH_ADDRESS]: 'ETH',
} as const

export const TOKEN_ADDRESSES = {
  WETH: WETH_ADDRESS,
  USDC: USDC_ADDRESS,
  ETH: ETH_ADDRESS,
} as const

// Token decimals
export const TOKEN_DECIMALS = {
  ETH: 18,
  WETH: 18,
  USDC: 6,
} as const

export const MAX_ETH_SUPPLY = 120700000
