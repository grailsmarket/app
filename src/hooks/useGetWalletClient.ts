import { useCallback } from 'react'
import { useConfig } from 'wagmi'
import { getWalletClient } from '@wagmi/core'

/**
 * Returns an async function that imperatively fetches the wallet client
 * from the active connector. Works reliably with Safe wallets where
 * the reactive useWalletClient() hook returns undefined.
 */
export function useGetWalletClient() {
  const config = useConfig()
  return useCallback(async () => {
    try {
      return await getWalletClient(config)
    } catch {
      throw new Error('Wallet client not available. Please ensure your wallet is connected.')
    }
  }, [config])
}
