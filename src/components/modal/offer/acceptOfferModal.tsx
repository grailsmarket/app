'use client'

import { useState, useEffect } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import {
  SEAPORT_ADDRESS,
  ENS_REGISTRAR_ADDRESS,
  ENS_NAME_WRAPPER_ADDRESS,
  OPENSEA_CONDUIT_ADDRESS,
  OPENSEA_CONDUIT_KEY,
  MARKETPLACE_CONDUIT_KEY,
  MARKETPLACE_CONDUIT_ADDRESS,
} from '@/constants/web3/contracts'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import Price from '@/components/ui/price'
import { DomainOfferType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { Check } from 'ethereum-identity-kit'
import { useQueryClient } from '@tanstack/react-query'
import User from '@/components/ui/user'
import { acceptOffer as acceptOfferApi } from '@/api/offers/accept'
import { useSeaportContext } from '@/context/seaport'
import { mainnet } from 'viem/chains'
import { AcceptOfferDomain } from '@/state/reducers/modals/acceptOfferModal'
import ClaimPoap from '../poap/claimPoap'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'

interface AcceptOfferModalProps {
  offer: DomainOfferType | null
  domain: AcceptOfferDomain | null
  onClose: () => void
}

type TransactionStep = 'review' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'

// ERC721/ERC1155 ABI for approve functions
const NFT_ABI = [
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const WRAPPER_ABI = [
  {
    inputs: [
      { internalType: 'contract ENS', name: '_ens', type: 'address' },
      { internalType: 'contract IBaseRegistrar', name: '_registrar', type: 'address' },
      { internalType: 'contract IMetadataService', name: '_metadataService', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  { inputs: [], name: 'CannotUpgrade', type: 'error' },
  { inputs: [], name: 'IncompatibleParent', type: 'error' },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'IncorrectTargetOwner',
    type: 'error',
  },
  { inputs: [], name: 'IncorrectTokenType', type: 'error' },
  {
    inputs: [
      { internalType: 'bytes32', name: 'labelHash', type: 'bytes32' },
      { internalType: 'bytes32', name: 'expectedLabelhash', type: 'bytes32' },
    ],
    name: 'LabelMismatch',
    type: 'error',
  },
  { inputs: [{ internalType: 'string', name: 'label', type: 'string' }], name: 'LabelTooLong', type: 'error' },
  { inputs: [], name: 'LabelTooShort', type: 'error' },
  { inputs: [], name: 'NameIsNotWrapped', type: 'error' },
  { inputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }], name: 'OperationProhibited', type: 'error' },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'addr', type: 'address' },
    ],
    name: 'Unauthorised',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'approved', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'account', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'controller', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'active', type: 'bool' },
    ],
    name: 'ControllerChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { indexed: false, internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    name: 'ExpiryExtended',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { indexed: false, internalType: 'uint32', name: 'fuses', type: 'uint32' },
    ],
    name: 'FusesSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { indexed: false, internalType: 'address', name: 'owner', type: 'address' },
    ],
    name: 'NameUnwrapped',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { indexed: false, internalType: 'bytes', name: 'name', type: 'bytes' },
      { indexed: false, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: false, internalType: 'uint32', name: 'fuses', type: 'uint32' },
      { indexed: false, internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    name: 'NameWrapped',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'previousOwner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'newOwner', type: 'address' },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { indexed: false, internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
    ],
    name: 'TransferBatch',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'id', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
    ],
    name: 'TransferSingle',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'string', name: 'value', type: 'string' },
      { indexed: true, internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'URI',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: '_tokens',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'uint32', name: 'fuseMask', type: 'uint32' },
    ],
    name: 'allFusesBurned',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'addr', type: 'address' },
    ],
    name: 'canExtendSubnames',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'addr', type: 'address' },
    ],
    name: 'canModifyName',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'controllers',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'ens',
    outputs: [{ internalType: 'contract ENS', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentNode', type: 'bytes32' },
      { internalType: 'bytes32', name: 'labelhash', type: 'bytes32' },
      { internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    name: 'extendExpiry',
    outputs: [{ internalType: 'uint64', name: '', type: 'uint64' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: 'operator', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'getData',
    outputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint32', name: 'fuses', type: 'uint32' },
      { internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentNode', type: 'bytes32' },
      { internalType: 'bytes32', name: 'labelhash', type: 'bytes32' },
    ],
    name: 'isWrapped',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    name: 'isWrapped',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'metadataService',
    outputs: [{ internalType: 'contract IMetadataService', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'names',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'onERC721Received',
    outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_token', type: 'address' },
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' },
    ],
    name: 'recoverFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'wrappedOwner', type: 'address' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
      { internalType: 'address', name: 'resolver', type: 'address' },
      { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
    ],
    name: 'registerAndWrapETH2LD',
    outputs: [{ internalType: 'uint256', name: 'registrarExpiry', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'registrar',
    outputs: [{ internalType: 'contract IBaseRegistrar', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'duration', type: 'uint256' },
    ],
    name: 'renew',
    outputs: [{ internalType: 'uint256', name: 'expires', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { inputs: [], name: 'renounceOwnership', outputs: [], stateMutability: 'nonpayable', type: 'function' },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeBatchTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentNode', type: 'bytes32' },
      { internalType: 'bytes32', name: 'labelhash', type: 'bytes32' },
      { internalType: 'uint32', name: 'fuses', type: 'uint32' },
      { internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    name: 'setChildFuses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'controller', type: 'address' },
      { internalType: 'bool', name: 'active', type: 'bool' },
    ],
    name: 'setController',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
    ],
    name: 'setFuses',
    outputs: [{ internalType: 'uint32', name: '', type: 'uint32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'contract IMetadataService', name: '_metadataService', type: 'address' }],
    name: 'setMetadataService',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'resolver', type: 'address' },
      { internalType: 'uint64', name: 'ttl', type: 'uint64' },
    ],
    name: 'setRecord',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'address', name: 'resolver', type: 'address' },
    ],
    name: 'setResolver',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentNode', type: 'bytes32' },
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint32', name: 'fuses', type: 'uint32' },
      { internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    name: 'setSubnodeOwner',
    outputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentNode', type: 'bytes32' },
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'resolver', type: 'address' },
      { internalType: 'uint64', name: 'ttl', type: 'uint64' },
      { internalType: 'uint32', name: 'fuses', type: 'uint32' },
      { internalType: 'uint64', name: 'expiry', type: 'uint64' },
    ],
    name: 'setSubnodeRecord',
    outputs: [{ internalType: 'bytes32', name: 'node', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'node', type: 'bytes32' },
      { internalType: 'uint64', name: 'ttl', type: 'uint64' },
    ],
    name: 'setTTL',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'contract INameWrapperUpgrade', name: '_upgradeAddress', type: 'address' }],
    name: 'setUpgradeContract',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'parentNode', type: 'bytes32' },
      { internalType: 'bytes32', name: 'labelhash', type: 'bytes32' },
      { internalType: 'address', name: 'controller', type: 'address' },
    ],
    name: 'unwrap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'labelhash', type: 'bytes32' },
      { internalType: 'address', name: 'registrant', type: 'address' },
      { internalType: 'address', name: 'controller', type: 'address' },
    ],
    name: 'unwrapETH2LD',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'name', type: 'bytes' },
      { internalType: 'bytes', name: 'extraData', type: 'bytes' },
    ],
    name: 'upgrade',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'upgradeContract',
    outputs: [{ internalType: 'contract INameWrapperUpgrade', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'uri',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes', name: 'name', type: 'bytes' },
      { internalType: 'address', name: 'wrappedOwner', type: 'address' },
      { internalType: 'address', name: 'resolver', type: 'address' },
    ],
    name: 'wrap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'label', type: 'string' },
      { internalType: 'address', name: 'wrappedOwner', type: 'address' },
      { internalType: 'uint16', name: 'ownerControlledFuses', type: 'uint16' },
      { internalType: 'address', name: 'resolver', type: 'address' },
    ],
    name: 'wrapETH2LD',
    outputs: [{ internalType: 'uint64', name: 'expiry', type: 'uint64' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const AcceptOfferModal: React.FC<AcceptOfferModalProps> = ({ offer, domain, onClose }) => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { isCorrectChain, checkChain, getCurrentChain } = useSeaportContext()

  const [step, setStep] = useState<TransactionStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [gasPrice, setGasPrice] = useState<bigint | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)

  useEffect(() => {
    getCurrentChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const orderBuilder = new SeaportOrderBuilder()

  useEffect(() => {
    // Estimate gas and check approval when modal opens
    if (offer && domain) {
      estimateGas()
      checkApproval()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offer, domain])

  if (!offer || !domain) return null

  const estimateGas = async () => {
    try {
      if (!address || !walletClient || !publicClient) return

      console.log('Offer data:', offer)
      console.log('Order data:', offer.order_data)

      // Parse the stored order from offer data
      const order = orderBuilder.parseStoredOrder(offer)
      if (!order) {
        console.error('Failed to parse order from offer:', offer)
        setError('Invalid offer data')
        return
      }

      // Get current gas price
      const currentGasPrice = await publicClient.getGasPrice()
      setGasPrice(currentGasPrice)

      try {
        // For accepting offers, we use fulfillAdvancedOrder
        const isOpenseaOrder = offer.source === 'opensea'
        const advancedOrder = orderBuilder.buildAdvancedOrder(order, isOpenseaOrder, address)
        const fulfillerConduitKey =
          advancedOrder.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'

        const estimatedGas = await publicClient.estimateContractGas({
          address: SEAPORT_ADDRESS as `0x${string}`,
          abi: SEAPORT_ABI,
          functionName: 'fulfillAdvancedOrder',
          args: [
            // @ts-expect-error AdvancedOrder is of the correct type
            advancedOrder,
            [], // criteriaResolvers
            fulfillerConduitKey,
            address, // recipient
          ],
          value: BigInt(0), // Offers don't require ETH value
          account: address,
        })

        // Add 20% buffer to the estimated gas
        const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100)
        setGasEstimate(gasWithBuffer)
      } catch (estimateError) {
        console.warn('Failed to estimate gas, using fallback:', estimateError)
        setGasEstimate(BigInt(400000))
      }
    } catch (err) {
      console.error('Failed to estimate gas:', err)
      setGasEstimate(BigInt(400000))
    }
  }

  const checkApproval = async () => {
    try {
      if (!address || !publicClient || !domain) return

      // Determine which NFT contract to check based on if the name is wrapped
      const isWrapped = await checkIfWrapped(domain.name)
      const nftContract = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS

      console.log('Parameters:', offer)
      const conduitKey = offer.order_data.protocol_data.parameters.conduitKey
      const conduitAddress =
        conduitKey === OPENSEA_CONDUIT_KEY
          ? OPENSEA_CONDUIT_ADDRESS
          : conduitKey === MARKETPLACE_CONDUIT_KEY
            ? (MARKETPLACE_CONDUIT_ADDRESS as `0x${string}`)
            : (SEAPORT_ADDRESS as `0x${string}`)

      console.log('Conduit address:', conduitAddress)

      // Check if Seaport is approved to transfer the NFT
      const isApproved = await publicClient.readContract({
        address: nftContract as `0x${string}`,
        abi: isWrapped ? WRAPPER_ABI : NFT_ABI,
        functionName: 'isApprovedForAll',
        args: [address, conduitAddress],
      })

      console.log('Is approved:', isApproved)

      setNeedsApproval(!isApproved)
    } catch (err) {
      console.error('Failed to check approval:', err)
      setNeedsApproval(true)
    }
  }

  const handleApprove = async () => {
    try {
      setError(null)
      setStep('approving')

      if (!address || !walletClient || !publicClient || !domain) {
        throw new Error('Wallet not connected')
      }

      // Determine which NFT contract to approve based on if the name is wrapped
      const isWrapped = await checkIfWrapped(domain.name)
      const nftContract = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS
      const conduitKey = offer.order_data.protocol_data.parameters.conduitKey
      const conduitAddress =
        conduitKey === OPENSEA_CONDUIT_KEY
          ? OPENSEA_CONDUIT_ADDRESS
          : conduitKey === MARKETPLACE_CONDUIT_KEY
            ? (MARKETPLACE_CONDUIT_ADDRESS as `0x${string}`)
            : (SEAPORT_ADDRESS as `0x${string}`)

      console.log('Conduit key:', conduitKey)
      console.log('Conduit address:', conduitAddress)
      console.log('NFT contract:', nftContract)
      console.log('Is wrapped:', isWrapped)
      console.log('Function name:', 'setApprovalForAll')
      console.log('Args:', [conduitAddress, true])

      // Approve Seaport to transfer the NFT
      const approveTx = await walletClient.writeContract({
        address: nftContract as `0x${string}`,
        abi: isWrapped ? WRAPPER_ABI : NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [conduitAddress, true],
      })

      setApproveTxHash(approveTx)

      // Wait for approval confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: approveTx,
        confirmations: 1,
      })

      if (receipt.status === 'success') {
        setNeedsApproval(false)
        setStep('review')
        // Automatically proceed to accept offer
        handleAcceptOffer()
      } else {
        throw new Error('Approval failed')
      }
    } catch (err: any) {
      console.error('Approval failed:', err)
      setError(err.message || 'Approval failed')
      setStep('error')
    }
  }

  const refetchDomainQueries = () => {
    queryClient.refetchQueries({ queryKey: ['name', 'details'] })
    queryClient.refetchQueries({ queryKey: ['portfolio', 'domains'] })
    queryClient.refetchQueries({ queryKey: ['received_offers'] })
    queryClient.refetchQueries({ queryKey: ['name', 'offers'] })
  }

  const handleAcceptOffer = async () => {
    try {
      setError(null)
      setStep('confirming')

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      // Parse the stored order from offer data
      console.log('Accepting offer:', offer)
      console.log('Order data:', offer.order_data)

      const order = orderBuilder.parseStoredOrder(offer)
      if (!order) {
        console.error('Failed to parse order for acceptance:', offer)
        throw new Error('Invalid offer data')
      }

      // Validate the order structure
      const validation = orderBuilder.validateOrder(order)
      if (!validation.valid) {
        throw new Error(validation.errors[0] || 'Invalid offer')
      }

      const isOpenseaOrder = offer.source === 'opensea'
      // Build advanced order for offer acceptance
      const advancedOrder = orderBuilder.buildAdvancedOrder(order, isOpenseaOrder, address)
      const fulfillerConduitKey =
        order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'

      console.log('Fulfiller conduit key:', fulfillerConduitKey)
      console.log('Advanced order:', advancedOrder)
      console.log('Order:', order)
      console.log('Address:', address)

      // Simulate the transaction
      try {
        await publicClient.simulateContract({
          address: SEAPORT_ADDRESS as `0x${string}`,
          abi: SEAPORT_ABI,
          functionName: 'fulfillAdvancedOrder',
          args: [
            // @ts-expect-error AdvancedOrder is of the correct type
            advancedOrder,
            [], // criteriaResolvers
            fulfillerConduitKey,
            address, // recipient of the payment
          ],
          value: BigInt(0), // Offers don't require ETH
          account: address,
        })
      } catch (simulateError: any) {
        console.error('Transaction simulation failed:', simulateError)
        throw new Error(`Transaction would fail: ${simulateError.shortMessage || simulateError.message}`)
      }

      setStep('processing')

      // Execute the transaction
      const tx = await walletClient.writeContract({
        address: SEAPORT_ADDRESS as `0x${string}`,
        abi: SEAPORT_ABI,
        functionName: 'fulfillAdvancedOrder',
        args: [
          // @ts-expect-error AdvancedOrder is of the correct type
          advancedOrder,
          [], // criteriaResolvers
          fulfillerConduitKey,
          address, // recipient
        ],
        value: BigInt(0),
        gas: gasEstimate || undefined,
      })

      setTxHash(tx)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

      if (receipt.status === 'success') {
        // Call API to mark offer as accepted
        await acceptOfferApi(offer.id)

        setStep('success')
        refetchDomainQueries()

        // TODO: Call API to update offer status
        // await updateOfferStatus(offer.id, 'accepted')
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Accept offer failed:', err)
      setError(err.message || 'Transaction failed')
      setStep('error')
    }
  }

  const getModalContent = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <div className='mb-4 space-y-4'>
              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Name</p>
                <p className='text-xl font-semibold'>{domain.name || `Token #${domain.tokenId}`}</p>
              </div>

              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Offer Amount</p>
                <Price
                  price={offer.offer_amount_wei}
                  currencyAddress={offer.currency_address}
                  fontSize='text-xl font-semibold'
                  iconSize='16px'
                />
              </div>

              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>From</p>
                <div className='max-w-2/3 text-xl'>
                  <User address={offer.buyer_address} />
                </div>
              </div>

              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Expires</p>
                <p className='text-xl'>{new Date(offer.expires_at).toLocaleDateString()}</p>
              </div>

              {gasEstimate && gasPrice && (
                <div className='flex flex-row items-center justify-between rounded-lg'>
                  <p className='font-sedan-sc text-xl'>Estimated Gas</p>
                  <div className='text-right'>
                    <p className='text-xl font-semibold'>
                      ~
                      {((gasEstimate * gasPrice) / BigInt(10 ** 18)).toString() === '0'
                        ? '<0.001'
                        : (Number(gasEstimate * gasPrice) / 10 ** 18).toFixed(6)}{' '}
                      ETH
                    </p>
                    <p className='text-sm text-gray-400'>
                      {gasEstimate.toString()} units @ {(Number(gasPrice) / 10 ** 9).toFixed(2)} gwei
                    </p>
                  </div>
                </div>
              )}
            </div>

            {needsApproval && (
              <div className='text-md p-sm mb-2 rounded-lg text-center'>
                You need to approve Seaport to transfer your NFT. This is a one time approval.
              </div>
            )}

            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton
                onClick={
                  isCorrectChain
                    ? needsApproval
                      ? handleApprove
                      : handleAcceptOffer
                    : () => checkChain({ chainId: mainnet.id, onSuccess: () => handleAcceptOffer() })
                }
                className='w-full'
                // disabled={isCorrectChain ? needsApproval : false}
              >
                {isCorrectChain ? (needsApproval ? 'Approve NFT Transfer' : 'Accept Offer') : 'Switch Chain'}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )

      case 'approving':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Approving NFT Transfer</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Approving Seaport to transfer your Name</p>
              {approveTxHash && <p className='text-neutral mt-2 font-mono text-xs break-all'>{approveTxHash}</p>}
            </div>
          </>
        )

      case 'confirming':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Confirm in Wallet</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Please confirm the transaction in your wallet</p>
            </div>
          </>
        )

      case 'processing':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Processing Transaction</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Transaction submitted</p>
              {txHash && <p className='text-neutral mt-2 font-mono text-xs break-all'>{txHash}</p>}
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 text-xl font-bold'>Offer Accepted!</div>
              <p className='text-gray-400'>
                You have successfully sold {domain.name} for{' '}
                <Price
                  price={offer.offer_amount_wei}
                  currencyAddress={offer.currency_address}
                  fontSize='text-base'
                  iconSize='14px'
                />
              </p>
            </div>
            <SecondaryButton onClick={onClose} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        )

      case 'error':
        return (
          <>
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='mb-4 text-2xl font-bold text-red-400'>Transaction Failed</h2>
              <p className='line-clamp-6 text-red-400'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton onClick={() => setStep('review')} className='w-full'>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div
      onClick={() => {
        if (step === 'review' || step === 'error') {
          onClose()
        }
      }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-primary bg-background relative flex w-full max-w-md flex-col rounded-md border-2 p-6'
      >
        {step === 'success' && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <h2 className='font-sedan-sc mb-6 text-center text-3xl'>Accept Offer</h2>
            {getModalContent()}
          </>
        )}
      </div>
    </div>
  )
}

export default AcceptOfferModal
