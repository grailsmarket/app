import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import type { Address } from 'viem'
import { getProof } from '@/api/user/anniversaryNFT/proof'
import { getStatus } from '@/api/user/anniversaryNFT/status'
import { ANNIVERSARY_NFT_ADDRESS } from '@/constants/anniversaryNFT'
import { activeChain } from '@/constants/web3/chain'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  closeAnniversaryNftModal,
  openAnniversaryNftModal,
  selectAnniversaryNftModal,
} from '@/state/reducers/portfolio/anniversaryNFT'
import { anniversaryNftQueryKey, useAnniversaryNftStatus } from './useAnniversaryNftStatus'
import { ANNIVERSARY_NFT_ABI } from '@/constants/web3/abi/AnniversaryNFT'

export const useAnniversaryNft = (address: Address | undefined, authenticated: boolean, cartOpen: boolean) => {
  const dispatch = useAppDispatch()
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const modal = useAppSelector(selectAnniversaryNftModal)
  const otherModalOpen = useAppSelector(
    (state) =>
      state.registration.isOpen ||
      Object.entries(state.modals).some(
        ([key, value]) => key !== 'anniversaryNftReducer' && 'open' in value && value.open
      )
  )

  const enabled = !!address && authenticated
  const key = anniversaryNftQueryKey(address)
  const {
    data: status,
    isFetching: statusFetching,
    isRefetching: statusRefetching,
  } = useQuery({
    queryKey: [...key, 'status'],
    queryFn: () => getStatus(address!),
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const isStatusLoading = statusFetching || statusRefetching

  const {
    data: proof,
    isFetching: proofFetching,
    isRefetching: proofRefetching,
  } = useQuery({
    queryKey: [...key, 'proof'],
    queryFn: () => getProof(address!),
    enabled: enabled && status?.status === null,
    refetchOnWindowFocus: false,
  })
  const isProofLoading = proofFetching || proofRefetching

  const { data: claimed } = useQuery({
    queryKey: [...key, 'claimed'],
    queryFn: () =>
      publicClient!.readContract({
        address: ANNIVERSARY_NFT_ADDRESS,
        abi: ANNIVERSARY_NFT_ABI,
        functionName: 'hasClaimed',
        args: [address!],
      }),
    enabled: enabled && !!publicClient && status?.status !== 'minted',
    staleTime: 0,
  })

  const {
    mutate: saveStatus,
    isPending: savingStatus,
    isError: saveFailed,
    reset: resetSave,
  } = useAnniversaryNftStatus(address)

  useEffect(() => {
    dispatch(closeAnniversaryNftModal())
    resetSave()
  }, [address, authenticated, dispatch, resetSave])

  useEffect(() => {
    if (!enabled || claimed !== true || status?.status === 'minted') return
    if (!modal.open && !savingStatus && !saveFailed) saveStatus('minted')
  }, [enabled, claimed, status, modal.open, savingStatus, saveFailed, saveStatus])

  useEffect(() => {
    const proofData = proof?.data

    if (
      !enabled ||
      isStatusLoading ||
      status?.status !== null ||
      isProofLoading ||
      !proofData?.eligible ||
      otherModalOpen ||
      cartOpen
    )
      return

    dispatch(openAnniversaryNftModal({ address: address!, tokenId: proofData.tokenId, proof: proofData.proof }))
  }, [address, enabled, status, isStatusLoading, proof, isProofLoading, claimed, otherModalOpen, cartOpen, dispatch])

  return { isAnniversaryNftMinted: enabled && (status?.status === 'minted' || claimed === true) }
}
