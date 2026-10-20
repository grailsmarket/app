import { BaseError, ContractFunctionRevertedError } from 'viem'
import { mainnet } from 'viem/chains'
import { activeChain } from '@/constants/web3/chain'
import type { TransferTransaction } from '@/types/transfer'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'
import { normalizeName } from '@/lib/ens'

export const getTransferDomainKey = (domain: Pick<TransferDomainType, 'name' | 'version'>) =>
  `${domain.version}:${normalizeName(domain.name)}`

export const getTransferChain = (version: 1 | 2) => (version === 1 ? mainnet : activeChain)

export const getTransferTransactionUrl = ({ hash, version }: TransferTransaction) =>
  `${getTransferChain(version).blockExplorers.default.url}/tx/${hash}`

export const getTransferError = (error: unknown) => {
  if (error instanceof BaseError) {
    const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError)
    if (reverted instanceof ContractFunctionRevertedError) {
      switch (reverted.data?.errorName) {
        case 'TransferDisallowed':
          return 'The owner no longer has permission to transfer this V2 name.'
        case 'TransferUnsafeUntilRegistryIsEmancipated':
          return 'This V2 registry still has administrators who can override name ownership. It does not allow safe transfers yet.'
        case 'TransferUnsafeWithMultipleAssignees':
          return 'Another account still has permissions on this V2 name. Remove those delegated permissions before transferring.'
        case 'ERC1155InvalidReceiver':
          return 'The recipient contract cannot receive these names. Choose an address that supports ERC1155 transfers.'
        case 'LabelExpired':
          return 'A selected name has expired. Renew it before transferring.'
        case 'OperationProhibited':
          return 'A selected wrapped name has transfer restrictions.'
      }
    }
    return error.shortMessage
  }
  return error instanceof Error ? error.message : 'Transfer failed. Please try again.'
}
