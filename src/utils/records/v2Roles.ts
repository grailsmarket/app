import {
  type Address,
  type Hex,
  type Log,
  type PublicClient,
  encodeFunctionData,
  hexToString,
  isAddress,
  keccak256,
  parseEventLogs,
  getAbiItem,
  zeroAddress,
} from 'viem'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import type { V2RecordField } from '@/types/records'
import { encodeRecordSetter, recordPermission, ROOT_NAME, validateRecordField } from './v2Records'
import { findDeploymentBlock, readLogs, readNameResolver } from './v2Resolver'

export type RoleKind = 'name' | 'resolver'
export type RoleDefinition = {
  id: string
  label: string
  bit: bigint
  adminOnly?: boolean
  field?: V2RecordField['kind']
  argument?: string
}

const bit = (position: number) => BigInt(1) << BigInt(position)
export const adminRole = (role: bigint) => role << BigInt(128)
export const hasRole = (bitmap: bigint, role: bigint) => (bitmap & role) === role

export const NAME_ROLES: RoleDefinition[] = [
  { id: 'transfer', label: 'Can Transfer', bit: bit(28), adminOnly: true },
  { id: 'resolver', label: 'Set Resolver', bit: bit(24) },
  { id: 'subregistry', label: 'Set Subregistry', bit: bit(20) },
  { id: 'renew', label: 'Renew', bit: bit(16) },
  { id: 'unregister', label: 'Unregister', bit: bit(12) },
]

export const RESOLVER_ROLE_DEFINITIONS: RoleDefinition[] = [
  { id: 'address', label: 'Set Address', bit: bit(0), field: 'address', argument: 'Coin type' },
  { id: 'text', label: 'Set Text', bit: bit(4), field: 'text', argument: 'Text key' },
  { id: 'contenthash', label: 'Set Content Hash', bit: bit(8) },
  { id: 'abi', label: 'Set ABI', bit: bit(12), field: 'abi', argument: 'Content type' },
  { id: 'interface', label: 'Set Interface', bit: bit(16), field: 'interface', argument: 'Interface ID' },
  { id: 'name', label: 'Set Name', bit: bit(20) },
  { id: 'data', label: 'Set Data', bit: bit(24), field: 'data', argument: 'Data key' },
  { id: 'link', label: 'Link', bit: bit(28) },
  { id: 'contract-name', label: 'Name Contract', bit: bit(120) },
  { id: 'upgrade', label: 'Upgrade', bit: bit(124) },
]

export const roleDefinitions = (kind: RoleKind) => (kind === 'name' ? NAME_ROLES : RESOLVER_ROLE_DEFINITIONS)
export type RoleAssignment = { account: Address; resource: bigint; bitmap: bigint; argument?: Hex }
export type RoleSnapshot = {
  contract: Address
  resource: bigint
  kind: RoleKind
  blockNumber: bigint
  owner?: Address
  viewerRoles: bigint
  viewerRootRoles: bigint
  initialAssignments: RoleAssignment[]
}
export type RoleChange = {
  kind: RoleKind
  contract: Address
  nameResource: bigint
  account: string
  roleId: string
  admin: boolean
  scoped: boolean
  key: string
  action: 'grant' | 'revoke'
  // History can contain an opaque scope. Revoking it does not require knowing its original argument.
  revokeResource?: bigint
}

export const roleChangeDetails = (change: RoleChange) => {
  if (!isAddress(change.account, { strict: false }) || change.account.toLowerCase() === zeroAddress)
    throw new Error('Enter a valid, non-zero wallet address.')
  const role = roleDefinitions(change.kind).find((item) => item.id === change.roleId)
  if (!role) throw new Error('Select a supported role.')
  if (role.adminOnly && !change.admin) throw new Error('Can Transfer only has an Admin permission.')
  if (change.kind === 'name' && change.action === 'grant' && change.admin)
    throw new Error('Name admin permissions can only be assigned at registration.')
  let resource = change.kind === 'name' ? change.nameResource : BigInt(0)
  let field: V2RecordField | undefined
  if (change.kind === 'name' && resource === BigInt(0)) throw new Error('This name has no registered resource.')
  if (change.kind === 'resolver' && change.scoped) {
    if (change.action === 'revoke' && change.revokeResource !== undefined) resource = change.revokeResource
    else {
      if (!role.field || !role.argument) throw new Error('This role only supports resolver-wide access.')
      field = validateRecordField({ kind: role.field, key: change.key })
      resource = recordPermission(field).resource
    }
    if (resource === BigInt(0)) throw new Error('Select a specific record argument.')
    if (change.action === 'grant' && change.admin)
      throw new Error('The resolver supports granting Admin permissions at resolver scope only.')
  }
  return { role, resource, field, bitmap: change.admin ? adminRole(role.bit) : role.bit }
}

export const encodeRoleChange = (change: RoleChange): Hex => {
  const { resource, field, bitmap } = roleChangeDetails(change)
  const account = change.account as Address
  if (change.kind === 'name') {
    return encodeFunctionData({
      abi: REGISTRY_V2_ABI,
      functionName: change.action === 'grant' ? 'grantRoles' : 'revokeRoles',
      args: [resource, bitmap, account],
    })
  }
  const abi = PERMISSIONED_RESOLVER_ABI
  if (resource === BigInt(0)) {
    return encodeFunctionData({
      abi,
      functionName: change.action === 'grant' ? 'grantRootRoles' : 'revokeRootRoles',
      args: [bitmap, account],
    })
  }
  if (change.action === 'revoke')
    return encodeFunctionData({ abi, functionName: 'revokeRoles', args: [resource, bitmap, account] })
  return encodeFunctionData({
    abi,
    functionName: 'grantSetterRoles',
    args: [encodeRecordSetter(field!, '', ROOT_NAME), account],
  })
}

export const readRoleAccess = async (
  client: PublicClient,
  contract: Address,
  resource: bigint,
  account: Address,
  blockNumber?: bigint
) => {
  // roles() includes approved-operator access in registries; root access must be combined separately.
  const read = { address: contract, abi: REGISTRY_V2_ABI, functionName: 'roles', blockNumber } as const
  const [roles, root] = await Promise.all([
    client.readContract({ ...read, args: [resource, account] }),
    resource === BigInt(0) ? BigInt(0) : client.readContract({ ...read, args: [BigInt(0), account] }),
  ])
  return { roles, root, effective: roles | root }
}

export const prepareRoleChange = async (
  client: PublicClient,
  name: string | null,
  ethRegistry: Address,
  account: Address,
  change: RoleChange
) => {
  const data = encodeRoleChange(change)
  const { resource, role } = roleChangeDetails(change)
  const fresh = name ? await readNameResolver(client, name, ethRegistry, account) : undefined
  if (change.kind === 'name') {
    if (
      !fresh?.registered ||
      fresh.registry.toLowerCase() !== change.contract.toLowerCase() ||
      fresh.resource !== change.nameResource
    )
      throw new Error('This name’s registration changed. Reload its permissions before continuing.')
  } else if (fresh && fresh.resolver.toLowerCase() !== change.contract.toLowerCase())
    throw new Error('This name’s resolver changed. Reload its permissions before continuing.')
  const access = await readRoleAccess(client, change.contract, resource, account)
  if (!hasRole(access.effective, adminRole(role.bit)))
    throw new Error('Your wallet no longer has permission to manage this role.')
  return data
}

export const readRoleSnapshot = async (
  client: PublicClient,
  contract: Address,
  resource: bigint,
  kind: RoleKind,
  viewer?: Address
): Promise<RoleSnapshot> => {
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 })
  // Verify the EAC interface even when no wallet is connected.
  await client.readContract({
    address: contract,
    abi: REGISTRY_V2_ABI,
    functionName: 'roleCount',
    args: [resource],
    blockNumber,
  })
  if (kind === 'resolver')
    await client.readContract({
      address: contract,
      abi: PERMISSIONED_RESOLVER_ABI,
      functionName: 'getRecordCount',
      blockNumber,
    })
  const owner =
    kind === 'name'
      ? await client.readContract({
          address: contract,
          abi: REGISTRY_V2_ABI,
          functionName: 'getOwner',
          args: [resource],
          blockNumber,
        })
      : undefined
  const access = viewer ? await readRoleAccess(client, contract, resource, viewer, blockNumber) : undefined
  const initialAssignments: RoleAssignment[] = []
  // An owner's own roles and resolver root roles are direct. Other registry roles() reads may include operators.
  if (owner && owner !== zeroAddress) {
    const ownerAccess =
      owner.toLowerCase() === viewer?.toLowerCase()
        ? access!
        : await readRoleAccess(client, contract, resource, owner, blockNumber)
    if (ownerAccess.roles) initialAssignments.push({ account: owner, resource, bitmap: ownerAccess.roles })
    if (ownerAccess.root) initialAssignments.push({ account: owner, resource: BigInt(0), bitmap: ownerAccess.root })
  }
  const viewerRoot = kind === 'resolver' ? access?.roles : access?.root
  if (
    viewer &&
    viewerRoot &&
    !initialAssignments.some(
      (item) => item.resource === BigInt(0) && item.account.toLowerCase() === viewer.toLowerCase()
    )
  )
    initialAssignments.push({ account: viewer, resource: BigInt(0), bitmap: viewerRoot })
  return {
    contract,
    resource,
    kind,
    blockNumber,
    owner,
    viewerRoles: access?.effective ?? BigInt(0),
    viewerRootRoles: viewerRoot ?? BigInt(0),
    initialAssignments,
  }
}

export const roleAssignmentsFromLogs = (logs: Log[], kind: RoleKind, resource: bigint): RoleAssignment[] => {
  const assignments = new Map<string, RoleAssignment>()
  const argumentsByResource = new Map<string, Hex>()
  const sorted = [...logs].sort((a, b) =>
    a.blockNumber === b.blockNumber ? (a.logIndex ?? 0) - (b.logIndex ?? 0) : a.blockNumber! < b.blockNumber! ? -1 : 1
  )
  // Both contracts share the EAC event; the resolver ABI also includes argument preimages.
  for (const log of parseEventLogs({ abi: PERMISSIONED_RESOLVER_ABI, logs: sorted })) {
    if (log.eventName === 'ResourceArgument') argumentsByResource.set(log.args.resource.toString(), log.args.arg)
    if (log.eventName !== 'EACRolesChanged') continue
    const { account, resource: scope, newRoleBitmap: bitmap } = log.args
    if (kind === 'name' && scope !== BigInt(0) && scope !== resource) continue
    assignments.set(`${scope}:${account.toLowerCase()}`, { account, resource: scope, bitmap })
  }
  return [...assignments.values()]
    .filter((item) => item.bitmap !== BigInt(0))
    .map((item) => ({ ...item, argument: argumentsByResource.get(item.resource.toString()) }))
}

export const readRoleHistory = async (
  client: PublicClient,
  snapshot: RoleSnapshot,
  signal?: AbortSignal,
  timeoutMs = 45_000
): Promise<RoleAssignment[]> => {
  const controller = new AbortController()
  const abort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new Error('Role-holder discovery timed out.')), timeoutMs)
  try {
    signal?.throwIfAborted()
    const discover = async () => {
      const { contract, blockNumber, resource, kind } = snapshot
      const start = await findDeploymentBlock(client, contract, blockNumber, controller.signal)
      const logs: Log[] = []
      const roleEvent = getAbiItem({ abi: PERMISSIONED_RESOLVER_ABI, name: 'EACRolesChanged' })
      const argumentEvent = getAbiItem({ abi: PERMISSIONED_RESOLVER_ABI, name: 'ResourceArgument' })
      // Filtering at the RPC avoids downloading every registration and record update in the registry.
      const fetchLogs = (fromBlock: bigint, toBlock: bigint) =>
        kind === 'name'
          ? client.getLogs({
              address: contract,
              event: roleEvent,
              args: { resource: [BigInt(0), resource] },
              fromBlock,
              toBlock,
            })
          : client.getLogs({ address: contract, events: [roleEvent, argumentEvent], fromBlock, toBlock })
      for (let from = start; from <= blockNumber; from += BigInt(4_000)) {
        controller.signal.throwIfAborted()
        const ranges: Promise<Log[]>[] = []
        for (let offset = BigInt(0); offset < BigInt(4_000) && from + offset <= blockNumber; offset += BigInt(1_000)) {
          const end = from + offset + BigInt(999)
          ranges.push(
            readLogs(
              client,
              contract,
              from + offset,
              end > blockNumber ? blockNumber : end,
              controller.signal,
              fetchLogs
            )
          )
        }
        logs.push(...(await Promise.all(ranges)).flat())
      }
      const assignments = roleAssignmentsFromLogs(logs, kind, resource)
      const resources = new Set([BigInt(0), resource, ...assignments.map((item) => item.resource)])
      // Counts catch truncated histories. Operator access must never be counted as a direct grant.
      for (const scope of resources) {
        controller.signal.throwIfAborted()
        const expected = await client.readContract({
          address: contract,
          abi: REGISTRY_V2_ABI,
          functionName: 'roleCount',
          args: [scope],
          blockNumber,
        })
        const actual = assignments
          .filter((item) => item.resource === scope)
          .reduce((sum, item) => sum + item.bitmap, BigInt(0))
        if (actual !== expected) throw new Error('The RPC returned incomplete role history.')
      }
      return assignments
    }
    const aborted = new Promise<never>((_, reject) =>
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), { once: true })
    )
    return await Promise.race([discover(), aborted])
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}

export const roleScopeLabel = (assignment: RoleAssignment, role: RoleDefinition, kind: RoleKind) => {
  if (assignment.resource === BigInt(0))
    return kind === 'name' ? 'All names in registry · inherited' : 'All configurations'
  if (kind === 'name') return 'This name'
  const arg = assignment.argument
  if (arg && BigInt(keccak256(arg)) === assignment.resource && role.argument) {
    try {
      const key =
        role.field === 'text' || role.field === 'data'
          ? hexToString(arg)
          : role.field === 'interface'
            ? arg
            : BigInt(arg).toString()
      return `${role.argument}: ${key} · all configurations`
    } catch {
      /* Keep the opaque resource visible if its preimage cannot be decoded. */
    }
  }
  return `Resource ${assignment.resource} · all configurations`
}
