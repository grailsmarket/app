import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { setStatus } from '@/api/user/anniversaryNFT/status'
import { activeChain } from '@/constants/web3/chain'
import { ANNIVERSARY_NFT_ADDRESS } from '@/constants/anniversaryNFT'
import type { AnniversaryNftStatus } from '@/types/profile'

export const anniversaryNftQueryKey = (address: Address | undefined) =>
  ['anniversary-nft', activeChain.id, ANNIVERSARY_NFT_ADDRESS, address?.toLowerCase()] as const

export const useAnniversaryNftStatus = (address: Address | undefined) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (status: AnniversaryNftStatus) => {
      if (!address) throw new Error('Connect your wallet to continue.')

      const result = (await setStatus({ address, status })) as boolean | { success: boolean }
      if (result !== true && !(typeof result === 'object' && result?.success === true))
        throw new Error('Unable to save your anniversary NFT status.')

      return { address, status }
    },
    onSuccess: async (data) => {
      const queryKey = [...anniversaryNftQueryKey(data.address), 'status']
      await queryClient.cancelQueries({ queryKey, exact: true })
      queryClient.setQueryData(queryKey, data)
    },
  })
}
