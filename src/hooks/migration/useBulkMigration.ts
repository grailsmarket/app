import { useId, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type Address,
  type Hex,
  encodeFunctionData,
  isAddress,
  labelhash,
  namehash,
  parseEventLogs,
  zeroAddress,
} from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { PERMISSIONED_RESOLVER_ABI as resolverAbi } from '@/constants/web3/abi/PermissionedResolver'
import { VERIFIABLE_FACTORY_ABI as factoryAbi } from '@/constants/web3/abi/VerifiableFactory'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { PublicResolverAbi } from '@/constants/web3/abi/PublicResolverAbi'
import { DEFAULT_V2_FIELDS } from '@/constants/ens/records'
import { createV2RecordsClient } from '@/utils/records/client'
import { buildRecordCalls, dnsEncodeName, recordPermission } from '@/utils/records/v2Records'
import { readResolverState } from '@/utils/records/v2Resolver'
import { newResolverVersion } from '@/utils/records/resolverDeployment'
import { createdConfigurationId } from '@/utils/settings/configurations'
import { readMigrationDeployment, readMigrationNames } from '@/utils/migration/migration'
import { bulkMigrationTransfer, groupBulkMigrations, migrationApproval } from '@/utils/migration/bulkMigration'
import { resetMigrationQueries } from '@/utils/migration/resetMigrationQueries'
import {
  publicResolverCopyCalls,
  readV1MigrationRecords,
  verifyReviewedMigrationRecords,
} from '@/utils/migration/records'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'
import { useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { useSettingsTransaction, type SettingsTransactionStep } from '@/hooks/settings/useSettingsTransaction'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { useAppDispatch } from '@/state/hooks'
import { removeBulkSelectNames } from '@/state/reducers/modals/bulkSelectModal'
import type { V2Record } from '@/types/records'
import type { MigrationRecordMode } from './useMigration'

const inBatches = async <T, R>(items: readonly T[], read: (item: T) => Promise<R>) => {
  const results: R[] = []
  for (let offset = 0; offset < items.length; offset += 5)
    results.push(...(await Promise.all(items.slice(offset, offset + 5).map(read))))
  return results
}

export const useBulkMigration = (names: string[]) => {
  const { address } = useAccount()
  const [account] = useState(address)
  const [mode, setMode] = useState<MigrationRecordMode>('copy')
  const [resolverInput, setResolverInput] = useState<string | null>(null)
  const [configuration, setConfiguration] = useState('0')
  const [acknowledged, setAcknowledged] = useState(false)
  const [migratedCount, setMigratedCount] = useState(0)
  const migrated = migratedCount > 0
  const session = useId()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const dispatch = useAppDispatch()
  const directory = useResolverDirectory()
  const transaction = useSettingsTransaction()
  const { getResolverData } = usePermissionedResolver()
  const walletChanged = address?.toLowerCase() !== account?.toLowerCase()
  const idle = transaction.phase === 'idle' && !walletChanged && !migrated
  const resolverValue = resolverInput ?? (directory.predicted.data || '')
  const resolver =
    isAddress(resolverValue, { strict: false }) && resolverValue !== zeroAddress ? resolverValue : undefined

  const deployment = useQuery({
    queryKey: ['migration', 'deployment', activeChain.id, config.ensV2MigrationHelper, config.ensV2Registry],
    queryFn: () => readMigrationDeployment(client, config.ensV2MigrationHelper, config.ensV2Registry, activeChain.id),
    retry: false,
    staleTime: 60_000,
  })

  const loading = useQuery({
    queryKey: ['migration', 'bulk', activeChain.id, account, session, names],
    enabled: !!deployment.data && !!account && idle,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const result = await readMigrationNames(client, deployment.data!, names, account!, signal)
      return {
        names: result.names,
        errors: result.errors.map(({ name, error }) => ({ name, message: roleErrorText(error) })),
      }
    },
  })

  const eligible = loading.data?.names ?? []
  const flexible = eligible.filter((name) => name.fixedResolver === null)
  const copies = eligible.filter((name) => name.replacesResolver || (mode === 'copy' && name.fixedResolver === null))

  const source = useQuery({
    queryKey: ['migration', 'bulk-records', activeChain.id, session, copies.map((name) => [name.name, name.resolver])],
    enabled: copies.length > 0 && idle,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const records: Record<string, V2Record[]> = {}
      await inBatches(copies, async (name) => {
        signal.throwIfAborted()
        records[name.name] = await readV1MigrationRecords(client, name.resolver, name.name, signal)
        if (name.replacesResolver) publicResolverCopyCalls(name.name, records[name.name])
      })
      return records
    },
  })

  const catalog = useQuery({
    queryKey: ['migration', 'bulk-target', activeChain.id, resolver, account],
    queryFn: () => readResolverState(client, resolver!, 'grails-bulk.invalid', account),
    enabled: !!resolver && flexible.length > 0 && mode !== 'none' && idle,
    retry: false,
  })

  const selectedId = /^\d+$/.test(configuration) ? BigInt(configuration) : undefined
  const validTarget =
    !flexible.length ||
    mode === 'none' ||
    ((mode === 'copy' || mode === 'empty') && !resolverValue.trim() && !directory.predicted.isLoading) ||
    (!!resolver &&
      !!catalog.data &&
      !catalog.isFetching &&
      !catalog.isError &&
      (mode !== 'existing' || (selectedId !== undefined && selectedId <= catalog.data.recordCount)))
  const canMigrate =
    !!account &&
    idle &&
    !transaction.pending &&
    acknowledged &&
    !!deployment.data &&
    !deployment.isError &&
    loading.isSuccess &&
    !loading.isFetching &&
    eligible.length > 0 &&
    validTarget &&
    (!copies.length || (source.isSuccess && !source.isFetching))

  const migrate = async () => {
    if (!canMigrate || !deployment.data || !account) return
    const contracts = deployment.data
    const snapshot = eligible
    const selectedMode = mode
    const id = selectedId ?? BigInt(0)
    const reviewedDefault = catalog.data?.defaultRecordId
    const captured = Object.fromEntries(
      copies.map(({ name }) => [name, (source.data?.[name] ?? []).map((record) => ({ ...record }))])
    )
    let target = !flexible.length || selectedMode === 'none' ? zeroAddress : resolver
    const preparedIds = new Map<string, bigint>()
    const completed = new Set<string>()
    const steps: SettingsTransactionStep[] = []

    const recheck = async (sender: Address) => {
      if (sender.toLowerCase() !== account.toLowerCase())
        throw new Error('Reconnect the wallet that opened this migration.')

      const remaining = snapshot.filter((name) => !completed.has(name.name))
      const currentNames = await readMigrationNames(
        client,
        contracts,
        remaining.map((name) => name.name),
        sender
      )
      const failure = currentNames.errors[0]
      if (failure) throw new Error(`${failure.name}: ${roleErrorText(failure.error)}`)
      const checked = new Map(currentNames.names.map((name) => [name.name, name]))
      for (const name of remaining) {
        const current = checked.get(name.name)
        if (
          !current ||
          current.tokenContract.toLowerCase() !== name.tokenContract.toLowerCase() ||
          current.receiver.toLowerCase() !== name.receiver.toLowerCase() ||
          current.requiresDirectMigration !== name.requiresDirectMigration ||
          current.fuses !== name.fuses ||
          current.resolver.toLowerCase() !== name.resolver.toLowerCase() ||
          current.fixedResolver?.toLowerCase() !== name.fixedResolver?.toLowerCase()
        )
          throw new Error(`Migration settings changed for ${name.name}. Return to review before continuing.`)
      }
    }

    if (!target) {
      const version = directory.predicted.data === false ? 0 : newResolverVersion()
      steps.push({
        label: 'Deploy Resolver',
        pendingLabel: 'Deploying Resolver',
        prepare: async (sender) => {
          await recheck(sender)
          const { resolverSalt, resolverInitData } = getResolverData(BigInt(version), sender)
          return {
            to: config.ensV2VerifiableFactory,
            data: encodeFunctionData({
              abi: factoryAbi,
              functionName: 'deployProxy',
              args: [config.ensV2PermissionedResolverImpl, resolverSalt, resolverInitData],
            }),
          }
        },
        confirmed: (receipt) => {
          const log = parseEventLogs({
            abi: factoryAbi,
            eventName: 'ProxyDeployed',
            logs: receipt.logs.filter(
              (entry) => entry.address.toLowerCase() === config.ensV2VerifiableFactory.toLowerCase()
            ),
          })[0]
          if (!log) throw new Error('Resolver deployed, but its address could not be read. Reopen the migration.')
          target = log.args.proxyAddress
          directory.remember(target, true)
          setResolverInput(target)
        },
      })
    }

    if (flexible.length && selectedMode !== 'none') {
      steps.push({
        label:
          selectedMode === 'copy'
            ? 'Copy Records to V2'
            : selectedMode === 'empty'
              ? 'Create Empty Configurations'
              : 'Link Record Configuration',
        pendingLabel: 'Preparing V2 Records',
        prepare: async (sender) => {
          await recheck(sender)
          if (!target) throw new Error('The resolver deployment has not completed.')
          const preparedTarget = target
          const calls = (
            await inBatches(flexible, async (name): Promise<Hex[]> => {
              const state = await readResolverState(client, preparedTarget, name.name, sender)
              if (selectedMode === 'existing') {
                if (id > state.recordCount) throw new Error('This configuration no longer exists.')
                if (id === BigInt(0) && state.defaultRecordId !== reviewedDefault)
                  throw new Error('The resolver default changed. Review it before migrating.')
                preparedIds.set(name.name, id)
                if (state.linkedRecordId === id) return []
                if (!state.canLink) throw new Error('You need Link permission on this resolver.')
                return [
                  encodeFunctionData({
                    abi: resolverAbi,
                    functionName: 'linkToRecord',
                    args: [dnsEncodeName(name.name), id],
                  }),
                ]
              }
              if (state.linkedRecordId && !state.canLink)
                throw new Error('You need Link permission to create separate configurations.')
              const copied = selectedMode === 'copy' ? (captured[name.name] ?? []) : []
              const records = copied.length
                ? copied
                : DEFAULT_V2_FIELDS.map((field) => ({ ...field, value: '', initialValue: '', editable: true }))
              await Promise.all(
                records.map(async (record) => {
                  const { role, resource } = recordPermission(record)
                  record.editable = await client.readContract({
                    address: preparedTarget,
                    abi: resolverAbi,
                    functionName: 'hasRoles',
                    args: [resource, role, sender],
                  })
                  if (copied.length && !record.editable)
                    throw new Error(
                      `You do not have permission to copy ${record.kind}: ${record.key}. Choose another resolver.`
                    )
                })
              )
              return buildRecordCalls({
                records,
                mode: 'copy',
                selectedId: BigInt(0),
                linkedId: state.linkedRecordId,
                dnsName: dnsEncodeName(name.name),
              })
            })
          ).flat()
          return calls.length
            ? { to: target, data: encodeFunctionData({ abi: resolverAbi, functionName: 'multicall', args: [calls] }) }
            : null
        },
        confirmed: (receipt) => {
          if (selectedMode !== 'existing' && target)
            for (const name of flexible)
              preparedIds.set(name.name, createdConfigurationId(receipt.logs, target, namehash(name.name)))
        },
      })
    }

    for (const tokenContract of new Set(
      snapshot.filter((name) => !name.requiresDirectMigration).map((name) => name.tokenContract)
    )) {
      steps.push({
        label: tokenContract === contracts.wrapper ? 'Approve Wrapped Names' : 'Approve Unwrapped Names',
        pendingLabel: 'Approving Migration Helper',
        prepare: async (sender) => {
          await recheck(sender)
          return migrationApproval(client, tokenContract, sender, config.ensV2MigrationHelper)
        },
      })
    }

    for (const group of groupBulkMigrations(snapshot))
      steps.push({
        label: `Migrate ${group.length} ${group.length === 1 ? 'Name' : 'Names'} to ENS V2`,
        pendingLabel: 'Migrating Names',
        prepare: async (sender) => {
          const remaining = group.filter((name) => !completed.has(name.name))
          if (!remaining.length) return null
          await recheck(sender)

          if (!target) throw new Error('Select a resolver before migrating.')

          const preparedTarget = target
          await inBatches(remaining, async (name) => {
            if (captured[name.name]?.length)
              await verifyReviewedMigrationRecords(client, name.resolver, name.name, captured[name.name])

            if (name.fixedResolver === null && selectedMode !== 'none') {
              const state = await readResolverState(client, preparedTarget, name.name, sender)
              if (
                !preparedIds.has(name.name) ||
                state.linkedRecordId !== preparedIds.get(name.name) ||
                (selectedMode === 'existing' && id === BigInt(0) && state.defaultRecordId !== reviewedDefault)
              )
                throw new Error(`The configuration for ${name.name} changed. Return to review before continuing.`)
            }
          })

          return bulkMigrationTransfer(remaining, target, config.ensV2MigrationHelper)
        },
        confirmed: () => {
          for (const name of group) completed.add(name.name)
          setMigratedCount(completed.size)
          dispatch(removeBulkSelectNames(group.map((name) => name.name)))

          for (const name of group)
            queries.setQueryData(['name', 'recordEditorVersion', activeChain.id, config.ensV2Registry, name.name], 2)

          resetMigrationQueries(
            queries,
            group.map((name) => name.name),
            account
          ).catch(() => {})
        },
      })

    const restores = snapshot.filter((name) => name.replacesResolver && captured[name.name]?.length)
    for (const publicResolver of new Set(restores.map((name) => name.fixedResolver!))) {
      const group = restores.filter((name) => name.fixedResolver === publicResolver)
      steps.push({
        label: 'Restore Locked Resolver Records',
        pendingLabel: 'Restoring Records',
        prepare: async (sender) => {
          await inBatches(group, async (name) => {
            const state = await client.readContract({
              address: name.registry,
              abi: REGISTRY_V2_ABI,
              functionName: 'getState',
              args: [BigInt(labelhash(name.label))],
            })

            if (state.status !== 2 || state.latestOwner.toLowerCase() !== sender.toLowerCase())
              throw new Error(`Connect the V2 owner of ${name.name} before restoring records.`)
          })

          return {
            to: publicResolver,
            data: encodeFunctionData({
              abi: PublicResolverAbi,
              functionName: 'multicall',
              args: [group.flatMap((name) => publicResolverCopyCalls(name.name, captured[name.name]))],
            }),
          }
        },
      })
    }

    await transaction.run(steps.map((step) => ({ ...step, readTimeoutMs: Math.max(30_000, snapshot.length * 3_000) })))
  }

  return {
    account,
    walletChanged,
    deployment,
    loading,
    source,
    directory,
    catalog,
    mode,
    setMode,
    resolverValue,
    setResolverInput,
    configuration,
    setConfiguration,
    acknowledged,
    setAcknowledged,
    canMigrate,
    migrate,
    transaction,
    migrated,
    migratedCount,
    complete: migrated && migratedCount === eligible.length && transaction.phase === 'success',
  }
}
