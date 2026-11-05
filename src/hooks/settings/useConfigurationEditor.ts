import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Address, encodeFunctionData, namehash } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import { readConfiguration, readNameResolver, readResolverHistory, readResolverState } from '@/utils/records/v2Resolver'
import { loadConfiguration } from '@/utils/records/loadResolver'
import { recordKey, validateRecordField } from '@/utils/records/v2Records'
import { configurationWrite, createdConfigurationId, newConfigurationName } from '@/utils/settings/configurations'
import { nameResolverSteps, prepareNameAssignment, type NameAssignment } from '@/utils/settings/nameAssignments'
import type { V2Record, V2RecordField } from '@/types/records'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { useResolverCatalog } from './useResolverDirectory'
import { useSettingsTransaction, type SettingsTransactionStep } from './useSettingsTransaction'
import { useConfigurationPreferences } from './useResolverPreferences'
import { configurationName } from '@/utils/settings/labels'

export const useConfigurationEditor = (resolver: Address, id: bigint, mode: 'edit' | 'new' | 'copy') => {
  const [drafts, setDrafts] = useState<Record<string, V2Record>>({})
  const [extras, setExtras] = useState<V2Record[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string>()
  const [createdId, setCreatedId] = useState<bigint>()
  const [names, setNames] = useState<NameAssignment[]>([])
  const [checkingNames, setCheckingNames] = useState(false)

  const { address } = useAccount()
  const queries = useQueryClient()
  const data = useResolverCatalog(resolver)
  const preferences = useConfigurationPreferences(resolver)
  const transaction = useSettingsTransaction(
    mode === 'edit'
      ? {
          title: 'Save Records',
          successMessage:
            id === BigInt(0)
              ? 'Every name using the resolver default now uses these records.'
              : `Every name linked to ${configurationName(preferences.data, id)} now uses these records.`,
        }
      : { title: 'Create Configuration', successTitle: 'Configuration Created' }
  )

  const recordsQuery = useQuery({
    meta: { ensApi: !!data.catalog?.permissions },
    queryKey: [
      'settings',
      'configuration',
      activeChain.id,
      resolver,
      id.toString(),
      address,
      data.catalog?.blockNumber.toString(),
      data.catalog?.historyComplete,
      data.history.isError,
    ],
    enabled:
      !!data.catalog &&
      (!data.catalog.permissions || data.catalog.historyComplete || data.history.isError) &&
      id <= data.catalog.recordCount,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: () =>
      loadConfiguration({
        client: data.client,
        resolver,
        catalog: data.catalog!,
        name: 'grails-settings.invalid',
        selectedId: id,
        account: address,
      }),
  })

  const initial = (row: V2Record) => (mode === 'new' ? { ...row, value: '', initialValue: '' } : row)
  const rows = new Map((recordsQuery.data ?? []).map((row) => [recordKey(row), initial(row)]))

  for (const row of extras) if (!rows.has(recordKey(row))) rows.set(recordKey(row), row)
  for (const [key, row] of Object.entries(drafts))
    rows.set(key, { ...row, editable: rows.get(key)?.editable ?? row.editable })

  const records = [...rows.values()]
  const changed = records.some((row) => row.value !== row.initialValue) || names.length > 0

  const addNames = async (selected: string[]) => {
    if (
      !address ||
      !data.catalog?.canLink ||
      checkingNames ||
      transaction.pending ||
      transaction.busy ||
      createdId !== undefined ||
      mode === 'edit'
    )
      return false

    setCheckingNames(true)
    setError(undefined)

    try {
      const added: NameAssignment[] = []
      const uniqueNames = [...new Set(selected)]

      for (let offset = 0; offset < uniqueNames.length; offset += 5) {
        const batch = await Promise.all(
          uniqueNames
            .slice(offset, offset + 5)
            .map((name) =>
              prepareNameAssignment(data.client, resolver, config.ensV2Registry, address, name, BigInt(0), queries)
            )
        )

        added.push(...batch)
      }

      setNames((previous) => [
        ...new Map([...previous, ...added].map((assignment) => [assignment.name, assignment])).values(),
      ])

      return true
    } catch (error) {
      setError(roleErrorText(error))

      return false
    } finally {
      setCheckingNames(false)
    }
  }

  const addRecord = async (field: V2RecordField) => {
    if (!data.catalog || adding) return false
    setAdding(true)
    setError(undefined)
    try {
      const valid = validateRecordField(field)
      const loaded = await loadConfiguration({
        client: data.client,
        resolver,
        catalog: data.catalog,
        name: 'grails-settings.invalid',
        selectedId: id,
        account: address,
        extraFields: [valid],
      })
      const row = loaded.find((row) => recordKey(row) === recordKey(valid))!
      setExtras((previous) => [...previous, initial(row)])
      return true
    } catch (error) {
      setError(roleErrorText(error))
      return false
    } finally {
      setAdding(false)
    }
  }

  const save = async () => {
    if (!data.catalog || transaction.pending || transaction.busy || checkingNames || createdId !== undefined) return

    const snapshot = data.catalog
    const captured = records.map((row) => ({ ...row }))
    const assignments = mode === 'edit' ? [] : names.map((assignment) => ({ ...assignment }))
    const name = assignments[0]?.name ?? newConfigurationName()

    const prepare = async (account: Address, requireResolver = true) => {
      const fresh = await readResolverState(data.client, resolver, 'grails-settings.invalid', account)

      if (mode !== 'new' && id === BigInt(0) && fresh.defaultRecordId !== snapshot.defaultRecordId)
        throw new Error('The default configuration changed. Reload before saving.')

      let catalog = {
        ...snapshot,
        ...fresh,
        names: snapshot.names,
        fields: snapshot.fields,
        interfaces: snapshot.interfaces,
        historyComplete: snapshot.historyComplete,
      }

      const missingAnchor =
        !catalog.canLink &&
        id !== BigInt(0) &&
        id !== catalog.defaultRecordId &&
        ![...catalog.names.values()].some((link) => link.recordId === id)
      const changesInterface =
        mode === 'edit' && captured.some((row) => row.kind === 'interface' && row.value !== row.initialValue)

      if (missingAnchor || changesInterface) {
        catalog = await readResolverHistory(data.client, resolver, catalog)
      }

      const current = await readConfiguration({
        client: data.client,
        resolver,
        catalog,
        name: 'grails-settings.invalid',
        selectedId: id,
        account,
        extraFields: captured,
      })

      const authorized = captured.map((row) => {
        const latest = current.find((item) => recordKey(item) === recordKey(row))!
        if (mode === 'edit' && row.value !== row.initialValue && latest.value !== row.initialValue)
          throw new Error('A record you edited changed onchain. Reload this configuration before saving.')
        return { ...row, editable: latest.editable }
      })

      for (const assignment of assignments) {
        const binding = await readNameResolver(data.client, assignment.name, config.ensV2Registry, account)
        const usesResolver = binding.resolver.toLowerCase() === resolver.toLowerCase()

        if (
          !binding.registered ||
          binding.registry.toLowerCase() !== assignment.binding.registry.toLowerCase() ||
          binding.resource !== assignment.binding.resource ||
          (!usesResolver &&
            (requireResolver ||
              !binding.canSetResolver ||
              binding.resolver.toLowerCase() !== assignment.binding.resolver.toLowerCase()))
        )
          throw new Error(`${assignment.name} changed since it was selected. Remove it and add it again.`)
      }

      const write = await configurationWrite({
        client: data.client,
        resolver,
        catalog,
        id,
        records: authorized,
        mode,
        name,
        names: assignments,
      })

      if (!write.calls.length) return null
      return { to: resolver, data: encodeFunctionData({ abi, functionName: 'multicall', args: [write.calls] }) }
    }

    const resolverSteps = nameResolverSteps(data.client, resolver, config.ensV2Registry, assignments)

    if (resolverSteps.length) {
      const first = resolverSteps[0].prepare

      resolverSteps[0].prepare = async (account) => {
        // Validate and simulate creation before changing any registry's resolver.
        const request = await prepare(account, false)

        if (request) await data.client.call({ account, ...request })

        return first(account)
      }
    }

    const createStep: SettingsTransactionStep = {
      label: mode === 'edit' ? 'Save Records' : 'Create Configuration',
      pendingLabel: mode === 'edit' ? 'Saving Records' : 'Creating Configuration',
      prepare: (account) => prepare(account),
      confirmed: (receipt) => {
        setDrafts({})
        setExtras([])
        setNames([])
        if (mode !== 'edit') {
          // Keep success even if a nonstandard receipt cannot be decoded: never offer a duplicate create.
          setCreatedId(BigInt(-1))
          try {
            const linked = createdConfigurationId(receipt.logs, resolver, namehash(name))
            setCreatedId(linked)
          } catch (error) {
            setError(roleErrorText(error))
          }
        }
      },
    }

    await transaction.run([...resolverSteps, createStep])
  }
  return {
    ...data,
    recordsQuery,
    records,
    changed,
    address,
    names,
    checkingNames,
    addNames,
    removeName: (name: string) => setNames((previous) => previous.filter((assignment) => assignment.name !== name)),
    adding,
    addRecord,
    error,
    createdId,
    transaction,
    save,
    updateRecord: (key: string, value: string) => {
      const row = rows.get(key)
      if (row) setDrafts((previous) => ({ ...previous, [key]: { ...row, value } }))
    },
    reset: () => {
      setDrafts({})
      setExtras([])
      setNames([])
      setError(undefined)
      transaction.reset()
    },
  }
}
