import { useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { type Address, encodeFunctionData, namehash } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { PERMISSIONED_RESOLVER_ABI as abi } from '@/constants/web3/abi/PermissionedResolver'
import { readConfiguration, readResolverHistory, readResolverState } from '@/utils/records/v2Resolver'
import { loadConfiguration } from '@/utils/records/loadResolver'
import { recordKey, validateRecordField } from '@/utils/records/v2Records'
import { configurationWrite, createdConfigurationId, newConfigurationName } from '@/utils/settings/configurations'
import type { V2Record, V2RecordField } from '@/types/records'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { useResolverCatalog } from './useResolverDirectory'
import { useSettingsTransaction } from './useSettingsTransaction'

export const useConfigurationEditor = (resolver: Address, id: bigint, mode: 'edit' | 'new' | 'copy') => {
  const { address } = useAccount()
  const data = useResolverCatalog(resolver)
  const transaction = useSettingsTransaction()
  const [drafts, setDrafts] = useState<Record<string, V2Record>>({})
  const [extras, setExtras] = useState<V2Record[]>([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string>()
  const [createdId, setCreatedId] = useState<bigint>()
  const placeholder = useRef<string>(undefined)
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
  const changed = records.some((row) => row.value !== row.initialValue)
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
    if (!data.catalog || transaction.pending || transaction.busy || createdId !== undefined) return
    const snapshot = data.catalog
    const captured = records.map((row) => ({ ...row }))
    const name = (placeholder.current ??= newConfigurationName())
    await transaction.run([
      {
        label: mode === 'edit' ? 'Save records' : 'Create configuration',
        prepare: async (account) => {
          const fresh = await readResolverState(data.client, resolver, 'grails-settings.invalid', account)
          if (id === BigInt(0) && fresh.defaultRecordId !== snapshot.defaultRecordId)
            throw new Error('The default configuration changed. Reload before saving.')
          // Read through the original links, then let configurationWrite verify they still point to this bundle.
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
            // Internal placeholder links are not exposed by the API. Scoped editors need an existing anchor.
            // Interface getters can return an address fallback, so fresh logs identify the stored value before writing.
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
          const write = await configurationWrite({
            client: data.client,
            resolver,
            catalog,
            id,
            records: authorized,
            mode,
            placeholder: name,
          })
          if (!write.calls.length) return null
          return { to: resolver, data: encodeFunctionData({ abi, functionName: 'multicall', args: [write.calls] }) }
        },
        confirmed: (receipt) => {
          setDrafts({})
          setExtras([])
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
      },
    ])
  }
  return {
    ...data,
    recordsQuery,
    records,
    changed,
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
      setError(undefined)
      transaction.reset()
    },
  }
}
