'use client'

import { useMemo, useSyncExternalStore } from 'react'
import { getAccount } from '@wagmi/core'
import { useConfig, usePublicClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { ANNIVERSARY_NFT_ADDRESS } from '@/constants/anniversaryNFT'
import { activeChain } from '@/constants/web3/chain'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { anniversaryNftQueryKey, useAnniversaryNftStatus } from '@/hooks/anniversary/useAnniversaryNftStatus'
import type { AnniversaryNftClaim } from '@/state/reducers/portfolio/anniversaryNFT'
import { ensureChain } from '@/utils/web3/ensureChain'
import { isSafeConnector, waitForTransaction } from '@/utils/web3/safeTransaction'
import { getAnniversaryClaimError, isAnniversaryMintReceipt } from '@/utils/anniversaryClaim'
import { anniversaryClaimSessions, UNCONFIRMED_ANNIVERSARY_CLAIM } from '@/utils/anniversaryClaimSession'
import { ANNIVERSARY_NFT_ABI } from '@/constants/web3/abi/AnniversaryNFT'

export const useAnniversaryClaim = (claim: AnniversaryNftClaim, onClose: () => void) => {
  const wagmiConfig = useConfig()
  const getWalletClient = useGetWalletClient()
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const queryClient = useQueryClient()
  const status = useAnniversaryNftStatus(claim.address)
  const queryKey = anniversaryNftQueryKey(claim.address)
  const sessionKey = JSON.stringify(queryKey)
  const session = useMemo(() => anniversaryClaimSessions.get(sessionKey), [sessionKey])
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getServerSnapshot)
  const { step, hash, error, statusError, dismissing, savingStatus } = snapshot

  const saveMinted = async () => {
    if (session.getSnapshot().savingStatus) return
    session.update({ statusError: null, savingStatus: true })

    try {
      await status.mutateAsync('minted')
    } catch {
      session.update({ statusError: 'Your NFT is minted, but we couldn’t save its status. Try saving again.' })
    } finally {
      session.update({ savingStatus: false })
    }
  }

  const complete = async () => {
    session.update({ pending: null, step: 'success' })

    await queryClient.cancelQueries({ queryKey: [...queryKey, 'claimed'], exact: true })
    queryClient.setQueryData([...queryKey, 'claimed'], true)

    saveMinted()
  }

  const checkAccount = () => {
    const account = getAccount(wagmiConfig)

    if (account.address?.toLowerCase() !== claim.address.toLowerCase())
      throw new Error('Connect the wallet eligible for this anniversary NFT to continue.')

    return account
  }

  const hasClaimed = () => {
    if (!publicClient) throw new Error('The network is unavailable. Please try again.')
    return publicClient.readContract({
      address: ANNIVERSARY_NFT_ADDRESS,
      abi: ANNIVERSARY_NFT_ABI,
      functionName: 'hasClaimed',
      args: [claim.address],
    })
  }

  const confirm = async () => {
    const transaction = session.getSnapshot().pending
    if (!transaction || !publicClient) throw new Error('The network is unavailable. Please try again.')

    session.update({ step: 'pending' })

    const receipt = await waitForTransaction(publicClient, transaction.hash, undefined, { isSafe: transaction.isSafe })
    session.update({ hash: receipt.transactionHash, pending: { hash: receipt.transactionHash, isSafe: false } })

    if (receipt.status !== 'success') {
      session.update({ pending: null })
      throw new Error('The mint transaction reverted. Your NFT was not claimed. Please try again.')
    }

    if (!isAnniversaryMintReceipt(receipt, claim) && !(await hasClaimed())) {
      session.update({ pending: null })
      throw new Error('The transaction completed without minting your NFT. You can try claiming again.')
    }

    await complete()
  }

  const mint = async () => {
    const current = session.getSnapshot()
    if (current.dismissing || current.step === 'success') return

    return session.run(async () => {
      session.update({ error: null, step: 'preparing' })

      try {
        if (!publicClient) throw new Error('The network is unavailable. Please try again.')

        if (session.getSnapshot().pending) {
          await confirm()
          return
        }

        session.update({ hash: null })
        checkAccount()

        if (await hasClaimed()) {
          await complete()
          return
        }

        session.update({ step: 'wallet' })
        const wallet = await getWalletClient()

        if (wallet.account.address.toLowerCase() !== claim.address.toLowerCase())
          throw new Error('Connect the wallet eligible for this anniversary NFT to continue.')

        await ensureChain(wallet, activeChain.id)

        const { request } = await publicClient.simulateContract({
          address: ANNIVERSARY_NFT_ADDRESS,
          abi: ANNIVERSARY_NFT_ABI,
          functionName: 'claim',
          args: [claim.address, BigInt(claim.tokenId), claim.proof],
          account: claim.address,
        })

        const connectedWallet = await getWalletClient()
        const account = checkAccount()
        if (
          connectedWallet.account.address.toLowerCase() !== claim.address.toLowerCase() ||
          (await connectedWallet.getChainId()) !== activeChain.id
        )
          throw new Error(`Connect your eligible wallet on ${activeChain.name} to continue.`)

        const transactionHash = await connectedWallet.writeContract({ ...request, chain: activeChain })
        session.update({
          pending: { hash: transactionHash, isSafe: isSafeConnector(account) },
          hash: transactionHash,
        })
        await confirm()
      } catch (cause) {
        session.update({
          error: session.getSnapshot().pending ? UNCONFIRMED_ANNIVERSARY_CLAIM : getAnniversaryClaimError(cause),
          step: 'error',
        })
      }
    })
  }

  const close = async () => {
    const current = session.getSnapshot()

    if (session.isRunning()) return
    if (current.step === 'success') {
      onClose()
      return
    }

    status.mutate('dismissed')
    onClose()
  }

  return {
    step,
    hash,
    error,
    statusError,
    dismissing,
    savingStatus,
    isBusy: step === 'preparing' || step === 'wallet' || step === 'pending',
    hasPendingTransaction: snapshot.pending !== null,
    mint,
    close,
    saveMinted,
  }
}
