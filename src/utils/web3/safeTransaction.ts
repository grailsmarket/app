import SafeAppsSDK from '@safe-global/safe-apps-sdk'
import type { PublicClient } from 'viem'
import type { GetAccountReturnType } from '@wagmi/core'

const SAFE_TX_POLL_INTERVAL = 3000
const SAFE_TX_POLL_TIMEOUT = 600_000 // 10 minutes

export function isSafeConnector(account: GetAccountReturnType): boolean {
  return account.connector?.id === 'safe' || account.connector?.type === 'safe'
}

export function isSafeAppContext(): boolean {
  if (typeof window === 'undefined') return false
  try {
    // Safe Apps run in an iframe inside the Safe Wallet
    if (window.self === window.top) return false
    return true
  } catch {
    return true
  }
}

async function getRealTxHashFromSafe(safeTxHash: string): Promise<`0x${string}` | null> {
  const sdk = new SafeAppsSDK()
  const startTime = Date.now()

  while (Date.now() - startTime < SAFE_TX_POLL_TIMEOUT) {
    try {
      const safeTx = await sdk.txs.getBySafeTxHash(safeTxHash)

      if (safeTx.txHash) {
        return safeTx.txHash as `0x${string}`
      }

      // If the transaction was executed but has no on-chain hash, it was rejected
      if (safeTx.executedAt && !safeTx.txHash) {
        return null
      }
    } catch (error) {
      console.error('Error getting real transaction hash from Safe:', error)
    }

    await new Promise((resolve) => setTimeout(resolve, SAFE_TX_POLL_INTERVAL))
  }

  return null
}

/*
  Waits for a transaction receipt, handling Safe Wallet transactions correctly.
  For regular wallets, this is just publicClient.waitForTransactionReceipt().
  For Safe wallets the hash from writeContract is actually a safeTxHash.
  This function polls the Safe API to get the real onchain tx hash first and
  then waits for the receipt.
  Accepts either a wagmi account object or automatically detects Safe App context.
*/
export async function waitForTransaction(
  publicClient: PublicClient,
  hash: `0x${string}`,
  account?: GetAccountReturnType,
  options?: { confirmations?: number }
) {
  let txHash = hash
  const isSafe = account ? isSafeConnector(account) : isSafeAppContext()

  if (isSafe) {
    const realHash = await getRealTxHashFromSafe(hash)

    if (!realHash) {
      throw new Error('Safe transaction was not executed. It may still be pending signatures or was rejected.')
    }

    txHash = realHash
  }

  return publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: options?.confirmations ?? 1,
  })
}
