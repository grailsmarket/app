import { Address, PublicClient } from 'viem'
import { config } from '@/lib/config'
import { ETH_REGISTRY_ABI } from '@/constants/web3/abi/ETHRegistry'

/**
 * Trading ENSv2 names. A v2 .eth name is an ERC1155 token on the ETHRegistry whose token ID
 * changes whenever roles on the name change, so orders must use the name's current token ID
 * (read from the registry, since our API can lag a block or two). A sale only goes through when
 * the registry allows the transfer: the owner holds the transfer role, nobody else holds a role on
 * the name (Seaport's transfers are "safe" transfers, which revert otherwise), and the registry is
 * emancipated. The backend runs the same checks before it accepts an order.
 */

// contracts-v2 RegistryRolesLib.ROLE_CAN_TRANSFER_ADMIN and EACBaseRolesLib.ALL_ROLES
const ROLE_CAN_TRANSFER_ADMIN = (BigInt(1) << BigInt(28)) << BigInt(128)
const ALL_ROLES = BigInt('0x1111111111111111111111111111111111111111111111111111111111111111')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const isEnsV2Name = (domain: { version?: number | null }) => domain.version === 2

export type EnsV2TransferCheck = { ok: true; tokenId: bigint } | { ok: false; tokenId: bigint; message: string }

/**
 * Whether `owner` can sell each name through Seaport right now. Takes any token ID the name has
 * had and returns its current one. Approval isn't checked here; callers request it.
 */
export async function checkEnsV2Transferable(
  publicClient: PublicClient,
  names: { name: string; tokenId: string }[],
  owner: Address
): Promise<EnsV2TransferCheck[]> {
  const contract = { address: config.ensV2Registry, abi: ETH_REGISTRY_ABI } as const

  const currentIds = await publicClient.multicall({
    contracts: names.map((n) => ({ ...contract, functionName: 'getTokenId', args: [BigInt(n.tokenId)] }) as const),
    allowFailure: false,
  })

  const [emancipated, owners, canTransfer, onlyAssignee] = await Promise.all([
    publicClient.readContract({ ...contract, functionName: 'isEmancipated' }),
    publicClient.multicall({
      contracts: currentIds.map((tokenId) => ({ ...contract, functionName: 'ownerOf', args: [tokenId] }) as const),
      allowFailure: false,
    }),
    publicClient.multicall({
      contracts: currentIds.map(
        (tokenId) =>
          ({ ...contract, functionName: 'hasRoles', args: [tokenId, ROLE_CAN_TRANSFER_ADMIN, owner] }) as const
      ),
      allowFailure: false,
    }),
    publicClient.multicall({
      contracts: currentIds.map(
        (tokenId) => ({ ...contract, functionName: 'isOnlyAssignee', args: [tokenId, ALL_ROLES, owner] }) as const
      ),
      allowFailure: false,
    }),
  ])

  return names.map((n, i) => {
    const tokenId = currentIds[i]
    const currentOwner = owners[i]
    const fail = (message: string): EnsV2TransferCheck => ({ ok: false, tokenId, message })

    if (currentOwner === ZERO_ADDRESS) return fail(`${n.name} has expired`)
    if (currentOwner.toLowerCase() !== owner.toLowerCase()) return fail(`You don't own ${n.name}`)
    if (!emancipated) return fail('The ENS registry is not allowing marketplace transfers yet')
    if (!canTransfer[i]) return fail(`${n.name} can't be transferred: its owner doesn't hold the transfer role`)
    if (!onlyAssignee[i]) {
      return fail(
        `Another account holds a role on ${n.name}. Remove other accounts' roles on the name before selling it`
      )
    }
    return { ok: true, tokenId }
  })
}

export async function isEnsV2OperatorApproved(publicClient: PublicClient, owner: Address, operator: Address) {
  return publicClient.readContract({
    address: config.ensV2Registry,
    abi: ETH_REGISTRY_ABI,
    functionName: 'isApprovedForAll',
    args: [owner, operator],
  })
}

/**
 * The token ID a stored listing trades: for a v2 name it's the order's ETHRegistry item (the
 * current ID when the order was signed), otherwise the name's token_id.
 */
type StoredOrderParameters = { offer?: { token: string; identifierOrCriteria: string }[] }

export function getListingTokenId(
  order: { parameters?: StoredOrderParameters; protocol_data?: { parameters?: StoredOrderParameters } },
  fallbackTokenId: string
): string {
  const parameters = order.parameters ?? order.protocol_data?.parameters
  const item = parameters?.offer?.find((o) => o.token.toLowerCase() === config.ensV2Registry.toLowerCase())
  return item ? BigInt(item.identifierOrCriteria).toString() : fallbackTokenId
}
