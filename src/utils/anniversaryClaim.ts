import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  parseEventLogs,
  zeroAddress,
  type TransactionReceipt,
} from 'viem'
import { ANNIVERSARY_NFT_ADDRESS } from '@/constants/anniversaryNFT'
import type { AnniversaryNftClaim } from '@/state/reducers/portfolio/anniversaryNFT'
import { ANNIVERSARY_NFT_ABI } from '@/constants/web3/abi/AnniversaryNFT'

export const isAnniversaryMintReceipt = (
  receipt: Pick<TransactionReceipt, 'status' | 'logs'>,
  claim: AnniversaryNftClaim
) =>
  receipt.status === 'success' &&
  parseEventLogs({
    abi: ANNIVERSARY_NFT_ABI,
    eventName: 'Transfer',
    logs: receipt.logs.filter((log) => log.address.toLowerCase() === ANNIVERSARY_NFT_ADDRESS.toLowerCase()),
  }).some(
    ({ args }) =>
      args.from === zeroAddress &&
      args.to.toLowerCase() === claim.address.toLowerCase() &&
      args.tokenId === BigInt(claim.tokenId)
  )

export const getAnniversaryClaimError = (error: unknown) => {
  if (error instanceof BaseError) {
    if (error.walk((cause) => cause instanceof UserRejectedRequestError) instanceof UserRejectedRequestError)
      return 'The wallet request was cancelled. You can try again when you’re ready.'

    const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      switch (reverted.data?.errorName) {
        case 'AlreadyClaimed':
          return 'This wallet has already claimed its anniversary NFT. Check again to view your NFT.'
        case 'ClaimsClosed':
          return 'Anniversary claims are not open right now. Please try again later.'
        case 'InvalidProof':
        case 'InvalidTokenId':
          return 'Your claim could not be verified. Please refresh the page and try again.'
      }
    }
    return error.shortMessage
  }
  return error instanceof Error ? error.message : 'The claim could not be completed. Please try again.'
}
