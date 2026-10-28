import { Address, PublicClient } from 'viem'
import { config } from '@/lib/config'
import { GRAILS_ETH_ROUTER_ABI } from '@/constants/web3/abi/GrailsETHRouter'
import { UNISWAP_V4_QUOTER_ABI } from '@/constants/web3/abi/UniswapV4Quoter'
import { ETH_ADDRESS, USDC_ADDRESS } from '@/constants/web3/tokens'

/**
 * Paying for ENSv2 registrations/renewals with ETH. ENS only accepts USDC/DAI, so GrailsETHRouter
 * buys the exact USDC a batch costs on Uniswap v4 and passes it to the bulk contract. Quotes stay in
 * USDC; the ETH cost comes from the v4 Quoter, plus a small headroom that the router refunds if unused.
 */

/** Headroom on top of the quoted ETH, in basis points. It's also the most a sandwich can take. */
export const ETH_PAYMENT_SLIPPAGE_BPS = 50
const DEADLINE_SECONDS = 10 * 60

export const isEthPaymentEnabled = !!config.ensEthRouter && !!config.uniswapV4Quoter

export const isEthPayment = (asset: Address) => asset.toLowerCase() === ETH_ADDRESS

/** The token ENS prices in: USDC when paying with ETH, otherwise the selected token. */
export const getPricingAsset = (asset: Address): Address => (isEthPayment(asset) ? USDC_ADDRESS : asset)

export const getEthRouterAddress = (): Address => {
  if (!config.ensEthRouter || !config.uniswapV4Quoter) throw new Error('Paying with ETH is not available.')
  return config.ensEthRouter
}

export const withEthSlippage = (eth: bigint) => (eth * BigInt(10_000 + ETH_PAYMENT_SLIPPAGE_BPS)) / BigInt(10_000)

export const getEthPaymentDeadline = () => BigInt(Math.floor(Date.now() / 1000) + DEADLINE_SECONDS)

type PoolKey = { currency0: Address; currency1: Address; fee: number; tickSpacing: number; hooks: Address }
let poolKeyRequest: Promise<PoolKey> | null = null

/** The router's fixed pool, read once. Also checks the router buys the USDC this app prices in. */
const getRouterPoolKey = (publicClient: PublicClient) => {
  poolKeyRequest ??= (async () => {
    const router = getEthRouterAddress()
    const [poolKey, usdc] = await Promise.all([
      publicClient.readContract({ address: router, abi: GRAILS_ETH_ROUTER_ABI, functionName: 'poolKey' }),
      publicClient.readContract({ address: router, abi: GRAILS_ETH_ROUTER_ABI, functionName: 'USDC' }),
    ])
    if (usdc.toLowerCase() !== USDC_ADDRESS.toLowerCase())
      throw new Error('Paying with ETH is misconfigured: the router uses a different USDC than this app.')
    return poolKey
  })().catch((error) => {
    poolKeyRequest = null
    throw error
  })
  return poolKeyRequest
}

/** ETH the router's swap needs to buy exactly `usdcAmount` USDC right now (no headroom). */
export const quoteEthForUsdc = async (publicClient: PublicClient, usdcAmount: bigint): Promise<bigint> => {
  if (usdcAmount <= BigInt(0)) return BigInt(0)
  const poolKey = await getRouterPoolKey(publicClient)
  const { result } = await publicClient.simulateContract({
    address: config.uniswapV4Quoter!,
    abi: UNISWAP_V4_QUOTER_ABI,
    functionName: 'quoteExactOutputSingle',
    args: [{ poolKey, zeroForOne: true, exactAmount: usdcAmount, hookData: '0x' }],
  })
  return result[0]
}

/** ETH amounts get up to 6 decimals, stablecoins 2. */
export const formatPaymentAmount = (amount: number, asset: Address) =>
  isEthPayment(asset) ? `${Number(amount.toFixed(6))}` : amount.toFixed(2)

export const ETH_PAYMENT_NOTE = `Paid by swapping ETH for USDC on Uniswap. Includes up to ${
  ETH_PAYMENT_SLIPPAGE_BPS / 100
}% price movement; unused ETH is refunded. If a name fails, its cost is refunded in USDC.`
