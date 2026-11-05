import { useEffect, useId, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { activeChain } from '@/constants/web3/chain'
import type { BulkV2Configuration, V2Record, V2RecordField } from '@/types/records'
import { createV2RecordsClient } from '@/utils/records/client'
import { loadConfiguration } from '@/utils/records/loadResolver'
import { buildRecordCalls, dnsEncodeName, recordKey, validateRecordField } from '@/utils/records/v2Records'
import {
  bulkConfigurationGroups,
  bulkGroupChanged,
  bulkNameChanged,
  loadBulkV2Resolvers,
  prepareBulkResolver,
} from '@/utils/records/bulkV2Records'
import { useSettingsTransaction } from '@/hooks/settings/useSettingsTransaction'
import { roleErrorText } from './useV2Roles'
import { useAppDispatch } from '@/state/hooks'
import { markImageForRefresh } from '@/state/reducers/imageRefresh'
import { invalidateNameMetadataCache } from '@/api/name/invalidateMetadataCache'

export const useBulkV2EditRecords = (names: string[], onClose: (txConfirmed?: boolean) => void) => {
  const { address } = useAccount()
  const [account] = useState(address)
  const session = useId()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const dispatch = useAppDispatch()
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof loadBulkV2Resolvers>>>()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [drafts, setDrafts] = useState<Record<string, V2Record[]>>({})
  const [completed, setCompleted] = useState<string[]>([])
  const [adding, setAdding] = useState<string>()
  const [error, setError] = useState<string>()
  const walletChanged = address?.toLowerCase() !== account?.toLowerCase()
  const transaction = useSettingsTransaction(
    {
      title: 'Save Records',
      successTitle: 'Records Saved',
      successMessage: 'Configuration records and name assignments have been updated.',
    },
    onClose
  )

  const loading = useQuery({
    queryKey: ['v2-records', 'bulk', activeChain.id, account, session, names],
    enabled: !!account && !snapshot && !walletChanged,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: ({ signal }) => loadBulkV2Resolvers(queries, client, names, account!, signal),
  })

  useEffect(() => {
    // Keep the editing baseline stable during API refreshes; prepareBulkResolver checks it against live state.
    if (loading.data && !snapshot) setSnapshot(loading.data)
  }, [loading.data, snapshot])

  const data = snapshot ?? loading.data
  const resolvers = (data?.resolvers ?? []).filter((resolver) => !completed.includes(resolver.address.toLowerCase()))
  const groups = bulkConfigurationGroups(resolvers, selections)
  const recordQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ['v2-records', 'bulk-configuration', activeChain.id, account, session, group.key],
      enabled: !walletChanged && transaction.phase === 'idle',
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      queryFn: async () => {
        const resolver = resolvers.find((resolver) => resolver.address === group.resolver)!
        const records = await loadConfiguration({
          client,
          resolver: group.resolver,
          catalog: resolver.catalog,
          selectedId: group.id,
          name: 'grails-bulk.invalid',
          account,
        })
        return group.mode === 'new' ? records.map((row) => ({ ...row, value: '', initialValue: '' })) : records
      },
    })),
  })

  const records = Object.fromEntries(
    groups.flatMap((group, index) => {
      const rows = drafts[group.key] ?? recordQueries[index].data
      return rows ? [[group.key, rows]] : []
    })
  ) as Record<string, V2Record[]>
  const changedGroups = groups.filter((group) => bulkGroupChanged(group, records[group.key] ?? [], selections))
  const changedNames = resolvers.flatMap((resolver) =>
    resolver.names.filter((name) => bulkNameChanged(name, selections))
  )
  const changedResolvers = resolvers.filter(
    (resolver) =>
      changedGroups.some((group) => group.resolver === resolver.address) ||
      resolver.names.some((name) => bulkNameChanged(name, selections))
  )
  const hasChanges = changedGroups.length > 0 || changedNames.length > 0
  const locked = transaction.phase !== 'idle' || walletChanged || !!adding
  let validationError: string | undefined

  try {
    for (const group of changedGroups) {
      const rows = records[group.key]
      if (!rows) throw new Error('Wait for the configurations to load before saving.')

      buildRecordCalls({
        records: rows,
        mode: group.mode,
        selectedId: group.id,
        linkedId: group.mode === 'shared' ? group.id : group.names[0].linkedId,
        dnsName: dnsEncodeName(group.names[0].name),
      })
    }
  } catch (error) {
    validationError = roleErrorText(error)
  }

  const leavingConfiguration = (name: string, value: string) => {
    const current = groups.find((group) => group.names.some((item) => item.name === name))
    const next = bulkConfigurationGroups(resolvers, { ...selections, [name]: value }).find((group) =>
      group.names.some((item) => item.name === name)
    )

    return current?.names.length === 1 && current.key !== next?.key ? current : undefined
  }

  const selectionDiscardsRecords = (name: string, value: string) => {
    const leaving = leavingConfiguration(name, value)

    return !!leaving && !!records[leaving.key]?.some((row) => row.value !== row.initialValue)
  }

  const selectConfiguration = (name: string, value: string) => {
    if (locked) return

    const group = leavingConfiguration(name, value)
    if (group) {
      setDrafts((previous) => {
        const next = { ...previous }
        delete next[group.key]
        return next
      })
    }

    setSelections((previous) => ({ ...previous, [name]: value }))
    setError(undefined)
  }

  const updateRecord = (group: BulkV2Configuration, key: string, value: string) => {
    if (locked || !records[group.key]) return

    setDrafts((previous) => ({
      ...previous,
      [group.key]: (previous[group.key] ?? records[group.key]).map((row) =>
        recordKey(row) === key && row.editable ? { ...row, value } : row
      ),
    }))
  }

  const addRecord = async (group: BulkV2Configuration, field: V2RecordField) => {
    if (locked) return false

    setAdding(group.key)
    setError(undefined)

    try {
      const valid = validateRecordField(field)
      const resolver = resolvers.find((resolver) => resolver.address === group.resolver)!
      const loaded = await loadConfiguration({
        client,
        resolver: group.resolver,
        catalog: resolver.catalog,
        selectedId: group.id,
        name: 'grails-bulk.invalid',
        account,
        extraFields: [valid],
      })
      const row = loaded.find((row) => recordKey(row) === recordKey(valid))!

      setDrafts((previous) => {
        const existing = previous[group.key] ?? records[group.key] ?? []
        if (existing.some((item) => recordKey(item) === recordKey(row))) return previous
        return {
          ...previous,
          [group.key]: [...existing, group.mode === 'new' ? { ...row, value: '', initialValue: '' } : row],
        }
      })
      return true
    } catch (error) {
      setError(roleErrorText(error))
      return false
    } finally {
      setAdding(undefined)
    }
  }

  const save = async () => {
    if (locked || !hasChanges || validationError) return

    const captured = Object.fromEntries(
      Object.entries(records).map(([key, rows]) => [key, rows.map((row) => ({ ...row }))])
    )

    await transaction.run(
      changedResolvers.map((resolver) => ({
        label: `Save configurations · ${resolver.address.slice(0, 6)}…${resolver.address.slice(-4)}`,
        pendingLabel: 'Saving Records',
        prepare: (sender) => {
          if (sender.toLowerCase() !== account?.toLowerCase())
            throw new Error('Reconnect the wallet that opened this editor.')

          return prepareBulkResolver({
            client,
            resolver,
            groups: groups.filter((group) => group.resolver === resolver.address),
            records: captured,
            selections: { ...selections },
            account: sender,
          })
        },
        confirmed: () => {
          // Completed resolvers leave the draft, so returning from a later failure cannot submit them again.
          setCompleted((previous) => [...previous, resolver.address.toLowerCase()])
          for (const name of resolver.names) {
            dispatch(markImageForRefresh(name.name))
            void invalidateNameMetadataCache(name.name).catch(() => {})
          }
        },
      }))
    )
  }

  return {
    account,
    walletChanged,
    loading,
    data,
    resolvers,
    groups,
    records,
    recordQueries,
    selections,
    changedGroups,
    changedNames,
    changedResolvers,
    hasChanges,
    locked,
    completed,
    adding,
    error,
    validationError,
    transaction,
    selectionDiscardsRecords,
    selectConfiguration,
    updateRecord,
    addRecord,
    save,
  }
}
