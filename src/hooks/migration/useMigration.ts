import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Address, encodeFunctionData, isAddress, labelhash, namehash, parseEventLogs, zeroAddress } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { PERMISSIONED_RESOLVER_ABI as resolverAbi } from '@/constants/web3/abi/PermissionedResolver'
import { VERIFIABLE_FACTORY_ABI as factoryAbi } from '@/constants/web3/abi/VerifiableFactory'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { createV2RecordsClient } from '@/utils/records/client'
import { DEFAULT_V2_FIELDS, buildRecordCalls, dnsEncodeName, recordPermission } from '@/utils/records/v2Records'
import { readResolverState } from '@/utils/records/v2Resolver'
import { newResolverVersion } from '@/utils/records/resolverDeployment'
import { createdConfigurationId } from '@/utils/settings/configurations'
import { migrationTransfer, readMigrationDeployment, readMigrationName } from '@/utils/migration/migration'
import {
  publicResolverCopyCalls,
  readV1MigrationRecords,
  verifyReviewedMigrationRecords,
} from '@/utils/migration/records'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'
import { useResolverDirectory } from '@/hooks/settings/useResolverDirectory'
import { useSettingsTransaction, type SettingsTransactionStep } from '@/hooks/settings/useSettingsTransaction'
import type { V2Record } from '@/types/records'
import { PublicResolverAbi } from '@/constants/web3/abi/PublicResolverAbi'

export type MigrationRecordMode = 'copy' | 'existing' | 'empty' | 'none'

export const useMigration = (name: string) => {
  const [mode, setMode] = useState<MigrationRecordMode>('copy')
  const [resolverInput, setResolverInput] = useState<string | null>(null)
  const [configuration, setConfiguration] = useState('0')
  const [acknowledged, setAcknowledged] = useState(false)
  const [migrated, setMigrated] = useState(false)
  const [complete, setComplete] = useState(false)

  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const directory = useResolverDirectory()
  const transaction = useSettingsTransaction()
  const { getResolverData } = usePermissionedResolver()
  const copiedRecords = useRef<V2Record[]>([])
  const postMigration = useRef<SettingsTransactionStep[]>([])
  const resolverValue = resolverInput ?? (directory.predicted.data || '')
  const resolver =
    isAddress(resolverValue, { strict: false }) && resolverValue !== zeroAddress ? resolverValue : undefined

  const deployment = useQuery({
    queryKey: ['migration', 'deployment', activeChain.id, config.ensV2MigrationHelper, config.ensV2Registry],
    queryFn: () => readMigrationDeployment(client, config.ensV2MigrationHelper, config.ensV2Registry, activeChain.id),
    retry: false,
    staleTime: 60_000,
  })

  const eligibility = useQuery({
    queryKey: ['migration', 'name', activeChain.id, config.ensV2MigrationHelper, name, address],
    queryFn: () => readMigrationName(client, deployment.data!, name, address!),
    enabled: !!deployment.data && !!address && !migrated,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const info = eligibility.data

  const source = useQuery({
    queryKey: ['migration', 'records', activeChain.id, name, info?.resolver],
    queryFn: ({ signal }) => readV1MigrationRecords(client, info!.resolver, name, signal),
    enabled: !!info && mode === 'copy' && (!info.fixedResolver || info.replacesResolver) && !migrated,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const catalog = useQuery({
    queryKey: ['migration', 'target', activeChain.id, resolver, name, address],
    queryFn: () => readResolverState(client, resolver!, name, address),
    enabled: !!resolver && !info?.fixedResolver && mode !== 'none' && !migrated,
    retry: false,
  })

  const selectedId = /^\d+$/.test(configuration) ? BigInt(configuration) : undefined
  const preserved = !!info && info.fixedResolver !== null && !info.replacesResolver
  const copies = mode === 'copy' && !preserved
  const validTarget =
    !!info &&
    (info.fixedResolver !== null ||
      mode === 'none' ||
      ((mode === 'copy' || mode === 'empty') && !resolverValue.trim() && !directory.predicted.isLoading) ||
      (!!resolver &&
        !!catalog.data &&
        !catalog.isFetching &&
        (mode !== 'existing' || (selectedId !== undefined && selectedId <= catalog.data.recordCount))))
  const canMigrate =
    !!info &&
    eligibility.isSuccess &&
    !eligibility.isFetching &&
    acknowledged &&
    validTarget &&
    (!copies || (source.isSuccess && !source.isFetching)) &&
    !transaction.pending &&
    !transaction.busy &&
    !migrated

  const migrate = async () => {
    if (!canMigrate || !info || !deployment.data || !address) return

    const snapshot = info
    const contracts = deployment.data
    const captured = (mode === 'copy' ? (source.data ?? []) : []).map((record) => ({ ...record }))
    copiedRecords.current = captured
    let target = info.fixedResolver ?? (mode === 'none' ? zeroAddress : resolver)
    const selectedMode = mode
    const id = selectedId ?? BigInt(0)
    const reviewedDefault = catalog.data?.defaultRecordId
    let preparedRecordId: bigint | undefined
    const steps: SettingsTransactionStep[] = []

    const recheck = async (account: Address) => {
      const current = await readMigrationName(client, contracts, name, account)

      if (
        current.receiver.toLowerCase() !== snapshot.receiver.toLowerCase() ||
        current.fuses !== snapshot.fuses ||
        current.resolver.toLowerCase() !== snapshot.resolver.toLowerCase() ||
        current.fixedResolver?.toLowerCase() !== snapshot.fixedResolver?.toLowerCase()
      )
        throw new Error('The name’s migration settings changed. Reload before continuing.')

      return current
    }

    if (!target) {
      const version = directory.predicted.data === false ? 0 : newResolverVersion()

      steps.push({
        label: 'Deploy resolver',
        prepare: async (account) => {
          await recheck(account)
          const { resolverSalt, resolverInitData } = getResolverData(BigInt(version))

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

          if (!log) throw new Error('Resolver deployed, but its address could not be read. Reload before continuing.')

          target = log.args.proxyAddress
          directory.remember(target, true)
          setResolverInput(target)
        },
      })
    }

    if (info.fixedResolver === null && selectedMode !== 'none') {
      steps.push({
        label:
          selectedMode === 'copy'
            ? 'Copy records to V2'
            : selectedMode === 'empty'
              ? 'Create empty configuration'
              : 'Link record configuration',
        prepare: async (account) => {
          await recheck(account)
          if (!target) throw new Error('The resolver deployment has not completed.')
          const state = await readResolverState(client, target, name, account)

          if (selectedMode === 'existing') {
            if (id > state.recordCount) throw new Error('This configuration no longer exists.')
            if (id === BigInt(0) && state.defaultRecordId !== reviewedDefault)
              throw new Error('The resolver default changed. Review its configuration before migrating.')
            preparedRecordId = id
            if (state.linkedRecordId === id) return null
            if (!state.canLink) throw new Error('You need Link permission on this resolver.')

            return {
              to: target,
              data: encodeFunctionData({
                abi: resolverAbi,
                functionName: 'linkToRecord',
                args: [dnsEncodeName(name), id],
              }),
            }
          }

          if (state.linkedRecordId && !state.canLink)
            throw new Error('You need Link permission to give this name a new configuration.')
          const records = captured.length
            ? captured
            : DEFAULT_V2_FIELDS.map((field) => ({ ...field, value: '', initialValue: '', editable: true }))

          const permissions = await Promise.all(
            records.map(async (record) => {
              const { role, resource } = recordPermission(record)
              return client.readContract({
                address: target!,
                abi: resolverAbi,
                functionName: 'hasRoles',
                args: [resource, role, account],
              })
            })
          )

          for (const [index, record] of records.entries()) {
            record.editable = permissions[index]
            if (captured.length && !record.editable)
              throw new Error(
                `You do not have permission to copy ${record.kind}: ${record.key}. Choose another resolver.`
              )
          }

          return {
            to: target,
            data: encodeFunctionData({
              abi: resolverAbi,
              functionName: 'multicall',
              args: [
                buildRecordCalls({
                  records,
                  mode: 'copy',
                  selectedId: BigInt(0),
                  linkedId: state.linkedRecordId,
                  dnsName: dnsEncodeName(name),
                }),
              ],
            }),
          }
        },
        confirmed: (receipt) => {
          if (selectedMode !== 'existing' && target)
            preparedRecordId = createdConfigurationId(receipt.logs, target, namehash(name))
        },
      })
    }

    steps.push({
      label: 'Migrate to ENS V2',
      prepare: async (account) => {
        const current = await recheck(account)
        if (!target) throw new Error('Select a resolver before migrating.')

        if (selectedMode === 'copy' && captured.length)
          await verifyReviewedMigrationRecords(client, snapshot.resolver, name, captured)

        if (snapshot.fixedResolver === null && selectedMode !== 'none') {
          const state = await readResolverState(client, target, name, account)

          if (
            preparedRecordId === undefined ||
            state.linkedRecordId !== preparedRecordId ||
            (selectedMode === 'existing' && id === BigInt(0) && state.defaultRecordId !== reviewedDefault)
          )
            throw new Error('The configuration link changed before migration. Review it before continuing.')
        }

        return migrationTransfer(current, target)
      },
      confirmed: () => {
        setMigrated(true)
        queries.setQueryData(['name', 'recordEditorVersion', activeChain.id, config.ensV2Registry, name], 2)
        if (!snapshot.replacesResolver || selectedMode !== 'copy' || !captured.length) setComplete(true)
      },
    })

    postMigration.current =
      info.replacesResolver && selectedMode === 'copy' && captured.length
        ? [
            {
              label: 'Restore records in PublicResolverV2',
              prepare: async (account) => {
                const state = await client.readContract({
                  address: snapshot.registry,
                  abi: REGISTRY_V2_ABI,
                  functionName: 'getState',
                  args: [BigInt(labelhash(snapshot.label))],
                })

                if (state.status !== 2 || state.latestOwner.toLowerCase() !== account.toLowerCase())
                  throw new Error('Connect the V2 owner before restoring records.')

                return {
                  to: snapshot.fixedResolver!,
                  data: encodeFunctionData({
                    abi: PublicResolverAbi,
                    functionName: 'multicall',
                    args: [publicResolverCopyCalls(name, copiedRecords.current)],
                  }),
                }
              },
              confirmed: () => {
                setComplete(true)
              },
            },
          ]
        : []
    steps.push(...postMigration.current)

    if (await transaction.run(steps)) {
      setComplete(true)
    }
  }

  const finishRecords = async () => {
    if (await transaction.run(postMigration.current)) {
      setComplete(true)
    }
  }

  return {
    address,
    deployment,
    eligibility,
    info,
    source,
    directory,
    catalog,
    transaction,
    mode,
    setMode,
    resolverValue,
    setResolverInput,
    configuration,
    setConfiguration,
    acknowledged,
    setAcknowledged,
    preserved,
    copies,
    canMigrate,
    migrate,
    migrated,
    complete,
    finishRecords,
  }
}
