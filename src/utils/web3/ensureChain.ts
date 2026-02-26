import type { WalletClient } from 'viem'

/**
 * Ensures the wallet is on the expected chain before a transaction.
 * Skips switching when already on the right chain and gracefully handles
 * wallets that don't support wallet_switchEthereumChain (e.g. Safe).
 */
export async function ensureChain(walletClient: WalletClient, chainId: number) {
  if (walletClient.chain?.id === chainId) return

  try {
    await walletClient.switchChain({ id: chainId })
  } catch {
    // Safe and some embedded wallets don't implement switchChain.
    // Double-check — if actually on the right chain, swallow the error.
    const currentChainId = await walletClient.getChainId()
    if (currentChainId !== chainId) {
      throw new Error(`Please switch your wallet to the correct network (chain ${chainId})`)
    }
  }
}
