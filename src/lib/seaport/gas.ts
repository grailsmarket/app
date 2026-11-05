export const FILL_GAS_FALLBACK_ERC20 = BigInt(600_000)
export const FILL_GAS_FALLBACK_ETH = BigInt(400_000)

export const withGasBuffer = (gas: bigint) => (gas * BigInt(120)) / BigInt(100)

export const estimateGasWithFallback = async (estimate: () => Promise<bigint>, fallback: bigint) => {
  try {
    return withGasBuffer(await estimate())
  } catch (err) {
    console.warn('Gas estimation failed, using fallback:', err)
    return fallback
  }
}
