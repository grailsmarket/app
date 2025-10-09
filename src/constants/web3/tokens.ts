export const WETH_ADDRESS = process.env.NEXT_PUBLIC_WETH_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // Mainnet
export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' // Mainnet

// Token decimals
export const TOKEN_DECIMALS = {
  ETH: 18,
  WETH: 18,
  USDC: 6,
} as const
