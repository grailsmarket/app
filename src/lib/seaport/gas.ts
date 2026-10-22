// Gas limits for Seaport fills.
//
// Fallbacks are only used when estimation fails (e.g. the buyer hasn't approved
// the payment token yet). ENSv2 registry transfers are expensive: on Sepolia a
// single transfer charges ~98k state gas, and a buyer with code (smart wallet or
// EIP-7702 account) adds an onERC1155Received callback. A 400k limit left only
// ~5k spare for a plain EOA and failed for a 7702 wallet, so keep these generous.
export const FILL_GAS_FALLBACK_ERC20 = BigInt(600_000)
export const FILL_GAS_FALLBACK_ETH = BigInt(400_000)

// Buffer added on top of a successful estimate (20%).
export const withGasBuffer = (gas: bigint) => (gas * BigInt(120)) / BigInt(100)

// Estimate gas with a buffer, or return the fallback if estimation fails.
export const estimateGasOr = async (estimate: () => Promise<bigint>, fallback: bigint) => {
  try {
    return withGasBuffer(await estimate())
  } catch (err) {
    console.warn('Gas estimation failed, using fallback:', err)
    return fallback
  }
}
