import { useCallback } from 'react'
import { useConfig } from 'wagmi'
import { getConnectedWalletClient } from '@/utils/web3/getConnectedWalletClient'

/**
 * Returns an async function that imperatively fetches the wallet client
 * from the active connector. Works reliably with Safe wallets where
 * the reactive useWalletClient() hook returns undefined.
 */
export function useGetWalletClient() {
  const config = useConfig()
  return useCallback(() => getConnectedWalletClient(config), [config])
}
