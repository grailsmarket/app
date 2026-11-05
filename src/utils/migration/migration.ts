import {
  type Address,
  type PublicClient,
  encodeAbiParameters,
  encodeFunctionData,
  labelhash,
  namehash,
  zeroAddress,
} from 'viem'
import { normalize } from 'viem/ens'
import { MIGRATION_HELPER_ABI } from '@/constants/web3/abi/MigrationHelper'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { BaseRegistrarAbi } from '@/constants/web3/abi/BaseRegistrar'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { RegistryAbi } from '@/constants/web3/abi/RegistryAbi'
import { VERIFIABLE_FACTORY_ABI } from '@/constants/web3/abi/VerifiableFactory'
import { MIGRATION_DATA } from '@/constants/ens/migration'
import { migrationAbi } from '@/constants/web3/abi/Migration'
import { ENS_V2_REGISTRAR } from '@/constants/web3/abi/RegistrarV2'
import { config } from '@/lib/config'

export interface MigrationDeployment {
  chainId: number
  wrapper: Address
  baseRegistrar: Address
  v1Registry: Address
  ethRegistry: Address
  unlockedController: Address
  lockedController: Address
  factory: Address
  wrapperRegistryImpl: Address
  parentGracePeriod: bigint
}

export interface MigrationName {
  name: string
  label: string
  owner: Address
  tokenId: bigint
  tokenContract: Address
  receiver: Address
  registry: Address
  wrapped: boolean
  locked: boolean
  fuses: number
  expiry: bigint
  resolver: Address
  fixedResolver: Address | null
  replacesResolver: boolean
  requiresDirectMigration: boolean
}

const sameAddress = (left: Address, right: Address) => left.toLowerCase() === right.toLowerCase()

export class MigrationEligibilityError extends Error {
  constructor(
    readonly reason:
      | 'unsupported-name'
      | 'parent-unavailable'
      | 'unsupported-parent'
      | 'already-migrated'
      | 'not-reserved'
      | 'unsupported-subname'
      | 'expired-subname'
      | 'grace-period'
      | 'not-owner'
      | 'transfer-locked'
      | 'frozen-approval',
    message: string
  ) {
    super(message)
    this.name = 'MigrationEligibilityError'
  }
}

export const readMigrationDeployment = async (
  client: PublicClient,
  helper: Address,
  ethRegistry: Address,
  chainId: number
): Promise<MigrationDeployment> => {
  if ((await client.getChainId()) !== chainId) throw new Error('The migration RPC is connected to the wrong network.')

  const [wrapper, root, unlockedController, lockedController] = await Promise.all(
    (['NAME_WRAPPER', 'ROOT_REGISTRY', 'UNLOCKED_CONTROLLER', 'LOCKED_CONTROLLER'] as const).map((functionName) =>
      client.readContract({ address: helper, abi: MIGRATION_HELPER_ABI, functionName })
    )
  )
  const [
    baseRegistrar,
    v1Registry,
    unlockedRegistry,
    lockedRegistry,
    rootEthRegistry,
    factory,
    wrapperRegistryImpl,
    parentGracePeriod,
  ] = await Promise.all([
    client.readContract({ address: wrapper, abi: NAME_WRAPPER_ABI, functionName: 'registrar' }),
    client.readContract({ address: wrapper, abi: NAME_WRAPPER_ABI, functionName: 'ens' }),
    client.readContract({ address: unlockedController, abi: migrationAbi, functionName: 'ETH_REGISTRY' }),
    client.readContract({ address: lockedController, abi: migrationAbi, functionName: 'ETH_REGISTRY' }),
    client.readContract({ address: root, abi: REGISTRY_V2_ABI, functionName: 'getSubregistry', args: ['eth'] }),
    client.readContract({ address: lockedController, abi: migrationAbi, functionName: 'VERIFIABLE_FACTORY' }),
    client.readContract({ address: lockedController, abi: migrationAbi, functionName: 'WRAPPER_REGISTRY_IMPL' }),
    client.readContract({ address: config.ensV2Registrar, abi: ENS_V2_REGISTRAR, functionName: 'GRACE_PERIOD' }),
  ])

  if ([unlockedRegistry, lockedRegistry, rootEthRegistry].some((registry) => !sameAddress(registry, ethRegistry)))
    throw new Error('The migration contracts do not match the configured ENS V2 registry.')

  return {
    chainId,
    wrapper,
    baseRegistrar,
    v1Registry,
    ethRegistry,
    unlockedController,
    lockedController,
    factory,
    wrapperRegistryImpl,
    parentGracePeriod,
  }
}

export const assertMigrationRestrictions = (fuses: number, approved: Address, isSubname: boolean) => {
  if (fuses & 4)
    throw new MigrationEligibilityError(
      'transfer-locked',
      'This name cannot migrate because its transfer permission is permanently locked.'
    )
  if (fuses & 1 && fuses & 64 && approved !== zeroAddress)
    throw new MigrationEligibilityError('frozen-approval', 'This name has a frozen token approval and cannot migrate.')
  if (isSubname && !(fuses & 65536))
    throw new MigrationEligibilityError(
      'unsupported-subname',
      'This subname is not emancipated. Its parent owner must recreate it in V2.'
    )
}

const assertMigrationReceiver = async (
  client: PublicClient,
  deployment: MigrationDeployment,
  receiver: Address,
  parent: string
) => {
  const [parentNode, wrapper] = await Promise.all([
    client.readContract({ address: receiver, abi: migrationAbi, functionName: 'getWrappedNode' }),
    client.readContract({ address: receiver, abi: migrationAbi, functionName: 'NAME_WRAPPER' }),
  ])
  const verified = await client.readContract({
    address: deployment.factory,
    abi: VERIFIABLE_FACTORY_ABI,
    functionName: 'verifyContract',
    args: [receiver],
  })

  if (
    !sameAddress(verified, deployment.wrapperRegistryImpl) ||
    !sameAddress(wrapper, deployment.wrapper) ||
    parentNode !== namehash(parent)
  )
    throw new MigrationEligibilityError(
      'unsupported-parent',
      'The parent subregistry is not a supported ENS migration receiver.'
    )
}

export const readMigrationName = async (
  client: PublicClient,
  deployment: MigrationDeployment,
  input: string,
  account: Address,
  { parents }: { parents?: ReadonlyMap<string, MigrationName> } = {}
): Promise<MigrationName> => {
  if (/\[[0-9a-f]{64}\]/i.test(input))
    throw new MigrationEligibilityError('unsupported-name', 'The full name is required to migrate this token.')
  const name = normalize(input)
  const labels = name.split('.')

  if (labels.length < 2 || labels.at(-1) !== 'eth')
    throw new MigrationEligibilityError('unsupported-name', 'Only .eth names and emancipated subnames can migrate.')

  const node = namehash(name)
  const isSubname = labels.length > 2
  const label = labels[0]
  const labelId = BigInt(labelhash(label))
  const now = (await client.getBlock()).timestamp
  let registry = deployment.ethRegistry
  const parent = parents?.get(labels.slice(1).join('.'))
  const pendingParent = parent?.locked ? parent : undefined
  let requiresDirectMigration = pendingParent?.requiresDirectMigration ?? false

  if (pendingParent) {
    registry = await client.readContract({
      address: deployment.factory,
      abi: VERIFIABLE_FACTORY_ABI,
      functionName: 'predictProxyAddress',
      args: [pendingParent.receiver, BigInt(namehash(pendingParent.name))],
    })
  } else
    for (let index = labels.length - 2; index > 0; index--) {
      const state = await client.readContract({
        address: registry,
        abi: REGISTRY_V2_ABI,
        functionName: 'getState',
        args: [BigInt(labelhash(labels[index]))],
      })

      if (state.status !== 2 || state.expiry <= now) {
        if (
          index !== labels.length - 2 ||
          state.latestOwner === zeroAddress ||
          state.expiry > now ||
          now >= state.expiry + deployment.parentGracePeriod
        )
          throw new MigrationEligibilityError(
            'parent-unavailable',
            'Migrate and renew the parent name before this subname.'
          )
        const parent = labels.slice(index).join('.')
        registry = await client.readContract({
          address: deployment.factory,
          abi: VERIFIABLE_FACTORY_ABI,
          functionName: 'predictProxyAddress',
          args: [deployment.lockedController, BigInt(namehash(parent))],
        })
        const code = await client.getCode({ address: registry })
        if (!code || code === '0x')
          throw new MigrationEligibilityError('unsupported-parent', 'The parent has no migration wrapper registry.')
        await assertMigrationReceiver(client, deployment, registry, parent)
        requiresDirectMigration = true
        continue
      }

      registry = await client.readContract({
        address: registry,
        abi: REGISTRY_V2_ABI,
        functionName: 'getSubregistry',
        args: [labels[index]],
      })

      if (registry === zeroAddress)
        throw new MigrationEligibilityError(
          'unsupported-parent',
          'The parent name does not have a migration subregistry.'
        )
    }

  if (!pendingParent) {
    const state = await client.readContract({
      address: registry,
      abi: REGISTRY_V2_ABI,
      functionName: 'getState',
      args: [labelId],
    })

    if (state.status === 2)
      throw new MigrationEligibilityError(
        'already-migrated',
        'This name is already registered in ENS V2 on this network.'
      )
    if (!isSubname && state.status !== 1)
      throw new MigrationEligibilityError('not-reserved', 'This name has no active V2 reservation on this network.')
  }

  const [wrappedData, resolver] = await Promise.all([
    client.readContract({
      address: deployment.wrapper,
      abi: NAME_WRAPPER_ABI,
      functionName: 'getData',
      args: [BigInt(node)],
    }),
    client.readContract({ address: deployment.v1Registry, abi: RegistryAbi, functionName: 'resolver', args: [node] }),
  ])
  const wrapped = wrappedData[0] !== zeroAddress
  const fuses = wrapped ? wrappedData[1] : 0
  const locked = !!(fuses & 1)
  let expiry = wrappedData[2]

  if (!isSubname) {
    expiry = await client.readContract({
      address: deployment.baseRegistrar,
      abi: BaseRegistrarAbi,
      functionName: 'nameExpires',
      args: [labelId],
    })
  } else if (!wrapped) {
    throw new MigrationEligibilityError(
      'unsupported-subname',
      'Only emancipated NameWrapper subnames can migrate. The parent owner must recreate other subnames in V2.'
    )
  }

  if (expiry <= now)
    throw new MigrationEligibilityError(
      isSubname ? 'expired-subname' : 'grace-period',
      isSubname
        ? 'This subname has expired and cannot be migrated.'
        : 'This name is in its V1 grace period. Renew it so its V1 expiry is in the future, then migrate.'
    )

  const owner = wrapped
    ? wrappedData[0]
    : await client.readContract({
        address: deployment.baseRegistrar,
        abi: BaseRegistrarAbi,
        functionName: 'ownerOf',
        args: [labelId],
      })

  if (!sameAddress(owner, account))
    throw new MigrationEligibilityError(
      'not-owner',
      'Connect the wallet that owns this V1 token on this network. Manager access is not enough.'
    )

  const approved = wrapped
    ? await client.readContract({
        address: deployment.wrapper,
        abi: NAME_WRAPPER_ABI,
        functionName: 'getApproved',
        args: [BigInt(node)],
      })
    : zeroAddress

  assertMigrationRestrictions(fuses, approved, isSubname)

  const receiver = isSubname ? registry : locked ? deployment.lockedController : deployment.unlockedController

  if (isSubname && !pendingParent)
    await assertMigrationReceiver(client, deployment, receiver, labels.slice(1).join('.'))

  let fixedResolver: Address | null = null

  if (locked && fuses & 8) {
    fixedResolver = resolver
    const receiverConfig = pendingParent ? deployment.wrapperRegistryImpl : receiver
    const set = await client.readContract({
      address: receiverConfig,
      abi: migrationAbi,
      functionName: 'PUBLIC_RESOLVER_SET',
    })

    if (
      resolver !== zeroAddress &&
      (await client.readContract({ address: set, abi: migrationAbi, functionName: 'includes', args: [resolver] }))
    )
      fixedResolver = await client.readContract({
        address: receiverConfig,
        abi: migrationAbi,
        functionName: 'PUBLIC_RESOLVER',
      })
  }

  return {
    name,
    label,
    owner,
    wrapped,
    locked,
    fuses,
    expiry,
    resolver,
    receiver,
    registry,
    fixedResolver,
    replacesResolver: fixedResolver !== null && !sameAddress(fixedResolver, resolver),
    requiresDirectMigration,
    tokenId: wrapped ? BigInt(node) : labelId,
    tokenContract: wrapped ? deployment.wrapper : deployment.baseRegistrar,
  }
}

export const readMigrationNames = async (
  client: PublicClient,
  deployment: MigrationDeployment,
  inputs: readonly string[],
  account: Address,
  signal?: AbortSignal
) => {
  const ordered = [...new Set(inputs)].sort((a, b) => a.split('.').length - b.split('.').length || a.localeCompare(b))
  const names = new Map<string, MigrationName>()
  const errors: { name: string; error: unknown }[] = []
  for (const depth of new Set(ordered.map((name) => name.split('.').length))) {
    const level = ordered.filter((name) => name.split('.').length === depth)
    for (let offset = 0; offset < level.length; offset += 5) {
      signal?.throwIfAborted()
      await Promise.all(
        level.slice(offset, offset + 5).map(async (name) => {
          try {
            const candidate = await readMigrationName(client, deployment, name, account, { parents: names })
            names.set(candidate.name, candidate)
          } catch (error) {
            errors.push({ name, error })
          }
        })
      )
    }
  }
  signal?.throwIfAborted()
  return {
    names: [...names.values()].sort(
      (a, b) => a.name.split('.').length - b.name.split('.').length || a.name.localeCompare(b.name)
    ),
    errors,
  }
}

export const migrationTransfer = (name: MigrationName, resolver: Address, subregistry: Address = zeroAddress) => {
  const payload = encodeAbiParameters(MIGRATION_DATA, [
    { label: name.label, owner: name.owner, subregistry, resolver: name.fixedResolver ?? resolver },
  ])

  return {
    to: name.tokenContract,
    data: name.wrapped
      ? encodeFunctionData({
          abi: NAME_WRAPPER_ABI,
          functionName: 'safeTransferFrom',
          args: [name.owner, name.receiver, name.tokenId, BigInt(1), payload],
        })
      : encodeFunctionData({
          abi: BaseRegistrarAbi,
          functionName: 'safeTransferFrom',
          args: [name.owner, name.receiver, name.tokenId, payload],
        }),
  }
}
