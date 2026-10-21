import { useCallback, useMemo } from 'react'
import { Address, createPublicClient, erc721Abi, http, labelhash, namehash, zeroAddress } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { BULK_TRANSFER_ABI } from '@/constants/web3/abi/BulkTransfer'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { ENS_V1_MAINNET_CONTRACTS } from '@/constants/web3/ens'
import { config } from '@/lib/config'
import { normalizeName } from '@/lib/ens'
import { getTransferChain } from '@/utils/transfer'
import { ensureChain } from '@/utils/web3/ensureChain'
import { ItemType } from '@/types/seaport'
import type { TransferBatch, TransferEntry } from '@/types/transfer'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'

const BATCH_SIZE = 100

const useTransferDomains = () => {
  const getWalletClient = useGetWalletClient()
  const v1Client = useMemo(() => createPublicClient({ chain: getTransferChain(1), transport: http() }), [])
  const v2Client = useMemo(() => createPublicClient({ chain: getTransferChain(2), transport: http() }), [])
  const getPublicClient = useCallback((version: 1 | 2) => (version === 1 ? v1Client : v2Client), [v1Client, v2Client])

  const prepareBatches = async (domains: TransferDomainType[], sender: Address): Promise<TransferBatch[]> => {
    const uniqueDomains = new Map<string, TransferDomainType>()

    for (const domain of domains) {
      if (domain.version !== 1 && domain.version !== 2) {
        throw new Error(`The ENS version of ${domain.name} is unknown. Refresh the name details before transferring.`)
      }

      const name = normalizeName(domain.name)
      uniqueDomains.set(`${domain.version}:${name}`, { ...domain, name })
    }

    const entries = await Promise.all(
      [...uniqueDomains.values()].map(async (domain): Promise<TransferEntry> => {
        const labels = domain.name.split('.')

        if (domain.version === 1) {
          const isWrapped = await v1Client.readContract({
            address: ENS_V1_MAINNET_CONTRACTS.nameWrapper,
            abi: NAME_WRAPPER_ABI,
            functionName: 'isWrapped',
            args: [namehash(domain.name)],
          })

          if (!isWrapped && (labels.length !== 2 || labels[1] !== 'eth')) {
            throw new Error(`${domain.name} is not a transferable V1 name token.`)
          }

          const token = isWrapped ? ENS_V1_MAINNET_CONTRACTS.nameWrapper : ENS_V1_MAINNET_CONTRACTS.registrar
          const tokenId = BigInt(isWrapped ? namehash(domain.name) : labelhash(labels[0]))
          const owner = await v1Client.readContract({
            address: token,
            abi: erc721Abi,
            functionName: 'ownerOf',
            args: [tokenId],
          })

          if (owner.toLowerCase() !== sender.toLowerCase()) {
            throw new Error(`The connected wallet no longer owns ${domain.name} on Ethereum mainnet.`)
          }

          return { domain, token, tokenId, itemType: isWrapped ? ItemType.ERC1155 : ItemType.ERC721 }
        }

        if (labels.length < 2 || labels[labels.length - 1] !== 'eth') {
          throw new Error('Only .eth names and their subnames can be transferred through the V2 registry here.')
        }

        let registry = config.ensV2Registry
        for (const label of labels.slice(1, -1).reverse()) {
          registry = await v2Client.readContract({
            address: registry,
            abi: REGISTRY_V2_ABI,
            functionName: 'getSubregistry',
            args: [label],
          })

          if (registry === zeroAddress) throw new Error(`Could not find the registry for ${domain.name}.`)
        }

        const state = await v2Client.readContract({
          address: registry,
          abi: REGISTRY_V2_ABI,
          functionName: 'getState',
          args: [BigInt(labelhash(labels[0]))],
        })

        if (state.status !== 2) throw new Error(`${domain.name} is not currently registered. Refresh its details.`)

        if (state.latestOwner.toLowerCase() !== sender.toLowerCase()) {
          throw new Error(`The connected wallet no longer owns ${domain.name} on ${getTransferChain(2).name}.`)
        }

        return { domain, token: registry, tokenId: state.tokenId, itemType: ItemType.ERC1155 }
      })
    )

    const batches: TransferBatch[] = []
    for (const version of [1, 2] as const) {
      const groups = new Map<Address, TransferEntry[]>()

      for (const entry of entries.filter((entry) => entry.domain.version === version)) {
        // Native V2 batches can only include names held by the same registry.
        const contract = version === 1 ? config.bulkTransferContract : entry.token
        const group = groups.get(contract) ?? []
        group.push(entry)
        groups.set(contract, group)
      }

      for (const [contract, group] of groups) {
        for (let index = 0; index < group.length; index += BATCH_SIZE) {
          batches.push({ version, contract, entries: group.slice(index, index + BATCH_SIZE) })
        }
      }
    }
    return batches
  }

  const getRequiredApprovals = async (batch: TransferBatch, sender: Address) => {
    if (batch.version !== 1) return []
    const contracts = [...new Set(batch.entries.map((entry) => entry.token))]
    const approved = await Promise.all(
      contracts.map((address) =>
        v1Client.readContract({
          address,
          abi: erc721Abi,
          functionName: 'isApprovedForAll',
          args: [sender, config.openseaConduitAddress],
        })
      )
    )
    return contracts.filter((_, index) => !approved[index])
  }

  const getWallet = async (sender: Address, version: 1 | 2) => {
    const wallet = await getWalletClient()
    if (wallet.account.address.toLowerCase() !== sender.toLowerCase()) {
      throw new Error('Reconnect the wallet that started this transfer.')
    }
    await ensureChain(wallet, getTransferChain(version).id)
    return wallet
  }

  const approve = async (contract: Address, sender: Address) => {
    const wallet = await getWallet(sender, 1)
    return wallet.writeContract({
      address: contract,
      abi: erc721Abi,
      functionName: 'setApprovalForAll',
      args: [config.openseaConduitAddress, true],
      chain: getTransferChain(1),
    })
  }

  const simulate = async (batch: TransferBatch, sender: Address, recipient: Address) => {
    if (batch.version === 1) {
      // Check transfer restrictions and receiver support before asking for operator approval.
      await Promise.all(
        batch.entries.map((entry) =>
          entry.itemType === ItemType.ERC721
            ? v1Client.simulateContract({
                address: entry.token,
                abi: erc721Abi,
                functionName: 'safeTransferFrom',
                args: [sender, recipient, entry.tokenId],
                account: sender,
              })
            : v1Client.simulateContract({
                address: entry.token,
                abi: NAME_WRAPPER_ABI,
                functionName: 'safeTransferFrom',
                args: [sender, recipient, entry.tokenId, BigInt(1), '0x'],
                account: sender,
              })
        )
      )
    } else {
      await v2Client.simulateContract({
        address: batch.contract,
        abi: REGISTRY_V2_ABI,
        functionName: 'safeBatchTransferFrom',
        args: [
          sender,
          recipient,
          batch.entries.map((entry) => entry.tokenId),
          batch.entries.map(() => BigInt(1)),
          '0x',
        ],
        account: sender,
      })
    }
  }

  const transfer = async (batch: TransferBatch, sender: Address, recipient: Address) => {
    const wallet = await getWallet(sender, batch.version)
    const chain = getTransferChain(batch.version)
    const freshBatches = await prepareBatches(
      batch.entries.map((entry) => entry.domain),
      sender
    )
    const fresh = freshBatches[0]

    if (freshBatches.length !== 1 || fresh.contract.toLowerCase() !== batch.contract.toLowerCase()) {
      throw new Error('A selected name changed registries. Refresh the transfer and try again.')
    }

    if (fresh.version === 1) {
      const request = {
        address: config.bulkTransferContract,
        abi: BULK_TRANSFER_ABI,
        functionName: 'bulkTransfer',
        args: [
          [
            {
              items: fresh.entries.map((entry) => ({
                itemType: entry.itemType,
                token: entry.token,
                identifier: entry.tokenId,
                amount: BigInt(1),
              })),
              recipient,
              validateERC721Receiver: true,
            },
          ],
          config.openseaConduitKey,
        ],
        account: sender,
        chain,
      } as const

      await v1Client.simulateContract(request)
      return wallet.writeContract(request)
    }

    const request = {
      address: fresh.contract,
      abi: REGISTRY_V2_ABI,
      functionName: 'safeBatchTransferFrom',
      args: [sender, recipient, fresh.entries.map((entry) => entry.tokenId), fresh.entries.map(() => BigInt(1)), '0x'],
      account: sender,
      chain,
    } as const

    await v2Client.simulateContract(request)
    return wallet.writeContract(request)
  }

  return { prepareBatches, getRequiredApprovals, approve, simulate, transfer, getPublicClient }
}

export default useTransferDomains
