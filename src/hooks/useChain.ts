import { useCallback, useEffect, useState } from 'react'
import { useChainId, useChains, useSwitchChain, useWalletClient } from 'wagmi'

/**
 * useChain hook - keeps track of the current chain id and switching between chains
 *
 * @returns the current chain id and a function to switch chains
 */
export const useChain = () => {
  const { data: walletClient } = useWalletClient()
  const { switchChain } = useSwitchChain()

  const defaultChainId = useChainId()
  const [currentChainId, setCurrentChainId] = useState(defaultChainId)

  const getCurrentChain = useCallback(async () => {
    if (!walletClient) return

    const chainId = walletClient.chain.id
    setCurrentChainId(chainId)
  }, [walletClient])

  useEffect(() => {
    getCurrentChain()
  }, [getCurrentChain])

  // // Auto-switch to mainnet when wallet is first connected
  // useEffect(() => {
  //   if (walletClient && walletClient.chain.id !== mainnet.id) {
  //     switchChain(
  //       { chainId: mainnet.id },
  //       {
  //         onSuccess: () => {
  //           setCurrentChainId(mainnet.id)
  //         },
  //       }
  //     )
  //   }
  //   // if (walletClient && !hasAutoSwitched && currentChainId !== mainnet.id) {
  //   //   switchChain(
  //   //     { chainId: mainnet.id },
  //   //     {
  //   //       onSuccess: () => {
  //   //         setCurrentChainId(mainnet.id)
  //   //         setHasAutoSwitched(true)
  //   //       },
  //   //       onError: () => {
  //   //         // If auto-switch fails, still mark as attempted to avoid infinite loops
  //   //         setHasAutoSwitched(true)
  //   //       }
  //   //     }
  //   //   )
  //   // }
  // }, [walletClient, currentChainId, switchChain])

  // check the current chain id and switch if it's not the correct chain
  const checkChain = useCallback(
    async ({ chainId, onSuccess, onError }: { chainId?: number; onSuccess?: () => void; onError?: () => void }) => {
      if (!chainId) return false
      if (currentChainId === chainId) return true

      await new Promise((resolve) =>
        switchChain(
          { chainId },
          {
            onSuccess: () => {
              onSuccess?.()
              getCurrentChain()
            },
            onError,
            onSettled: resolve,
          }
        )
      )
      return false
    },
    [currentChainId, switchChain, getCurrentChain]
  )

  // All supported chains
  const chains = useChains()
  const getChain = (chainId: number | undefined) => chains.find((chain) => chain.id === chainId)

  return {
    getChain,
    checkChain,
    currentChainId,
    getCurrentChain,
  }
}
