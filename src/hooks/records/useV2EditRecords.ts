import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type Address, type Hex, BaseError, isAddress, labelhash, namehash, zeroAddress, zeroHash } from 'viem'
import { normalize } from 'viem/ens'
import { activeChain } from '@/constants/web3/chain'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { getUserResolvers } from '@/api/resolvers/getResolvers'
import { invalidateNameMetadataCache } from '@/api/name/invalidateMetadataCache'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { readConfiguration, readNameResolver, readResolverHistory, readResolverState } from '@/utils/records/v2Resolver'
import { buildRecordCalls, dnsEncodeName, recordKey, uint256, validateRecordField } from '@/utils/records/v2Records'
import type { V2Record, V2RecordField, V2RecordMode } from '@/types/records'
import type { EditStep } from './useEditRecords'
import { useAppDispatch } from '@/state/hooks'
import { markImageForRefresh } from '@/state/reducers/imageRefresh'
import { config } from '@/lib/config'
import { createV2RecordsClient } from '@/utils/records/client'
import { newResolverVersion } from '@/utils/records/resolverDeployment'

type PendingWrite = { hash: Hex; kind: 'records' | 'resolver' | 'deploy'; sender: Address }

const errorText = (error: unknown) => {
  if (error instanceof BaseError) return error.shortMessage
  return error instanceof Error ? error.message : 'Could not save these changes.'
}

export const useV2EditRecords = (name: string, recordsEnabled = true) => {
  const { address } = useAccount()
  const getWalletClient = useGetWalletClient()
  const { deployResolver, getDeployedResolver } = usePermissionedResolver()
  const client = useMemo(createV2RecordsClient, [])
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()
  const [step, setStep] = useState<EditStep>('editing')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<Hex | null>(null)
  const [pending, setPending] = useState<PendingWrite | null>(null)
  const pendingRef = useRef<PendingWrite | null>(null)
  const busy = useRef(false)
  const [mode, setMode] = useState<V2RecordMode>('shared')
  const [selection, setSelection] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ key: string; rows: V2Record[] } | null>(null)
  const [resolverInput, setResolverInput] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [operation, setOperation] = useState<PendingWrite['kind']>('records')

  const binding = useQuery({
    queryKey: ['v2-records', 'name', activeChain.id, config.ensV2Registry, name, address],
    queryFn: () => readNameResolver(client, name, config.ensV2Registry, address),
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const resolver = binding.data?.resolver
  const resolverExists = !!resolver && resolver !== zeroAddress
  const snapshot = useQuery({
    queryKey: ['v2-records', 'state', activeChain.id, resolver, name, address],
    queryFn: () => readResolverState(client, resolver!, name, address),
    enabled: recordsEnabled && resolverExists,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const history = useQuery({
    queryKey: ['v2-records', 'history', activeChain.id, resolver, name, address, snapshot.data?.blockNumber.toString()],
    queryFn: ({ signal }) => readResolverHistory(client, resolver!, snapshot.data!, signal),
    enabled: recordsEnabled && !!snapshot.data && !snapshot.data.historyComplete,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const catalog = { data: history.data ?? snapshot.data }
  const resolvers = useQuery({
    queryKey: ['user', 'resolvers', address],
    queryFn: () => getUserResolvers({ userAddress: address! }),
    enabled: !!address,
    retry: false,
  })

  const selected = selection ?? catalog.data?.linkedRecordId.toString() ?? '0'
  let selectedId = BigInt(0)
  let selectionError: string | null = null

  try {
    selectedId = uint256(selected)
    if (catalog.data && selectedId > catalog.data.recordCount) throw new Error('This configuration does not exist.')
  } catch (error) {
    selectionError = errorText(error)
  }

  const recordQuery = useQuery({
    queryKey: [
      'v2-records',
      'values',
      activeChain.id,
      resolver,
      name,
      address,
      selected,
      snapshot.data?.blockNumber.toString(),
    ],
    queryFn: () =>
      readConfiguration({ client, resolver: resolver!, catalog: snapshot.data!, name, selectedId, account: address }),
    enabled: recordsEnabled && !!snapshot.data && !selectionError && resolverExists,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const discoveredRecords = useQuery({
    queryKey: [
      'v2-records',
      'discoveredValues',
      activeChain.id,
      resolver,
      name,
      address,
      selected,
      history.data?.blockNumber.toString(),
    ],
    queryFn: () =>
      readConfiguration({ client, resolver: resolver!, catalog: history.data!, name, selectedId, account: address }),
    enabled: recordsEnabled && !!history.data && !selectionError && resolverExists,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const recordData = discoveredRecords.data ?? recordQuery.data
  const hasCompleteRecords = !!discoveredRecords.data || (!!snapshot.data?.historyComplete && !!recordQuery.data)
  const discoveryError = history.error || discoveredRecords.error
  const viewKey = `${address}:${resolver}:${selected}:${mode}`
  const activeView = useRef(viewKey)
  activeView.current = viewKey
  const rows = new Map(
    (recordData ?? []).map((row) => [
      recordKey(row),
      {
        ...row,
        value: mode === 'new' ? '' : row.value,
        initialValue: mode === 'shared' ? row.initialValue : '',
      },
    ])
  )
  // Discovering custom keys must not discard edits or manually added fields already in progress.
  if (draft?.key === viewKey)
    for (const row of draft.rows) {
      const latest = rows.get(recordKey(row))
      rows.set(recordKey(row), { ...row, editable: latest?.editable ?? row.editable })
    }

  const records = [...rows.values()]
  const isLoading =
    binding.isPending ||
    binding.isFetching ||
    (resolverExists &&
      (snapshot.isPending || snapshot.isFetching || (!recordData && recordQuery.isPending)) &&
      !snapshot.isError &&
      !selectionError)
  const loadError = binding.error || snapshot.error || (!recordData && recordQuery.error)
  const isBusy = step === 'confirming' || step === 'processing'
  const hasChanges =
    mode !== 'shared' ||
    (!!catalog.data && selectedId !== catalog.data.linkedRecordId) ||
    records.some((row) => row.value !== row.initialValue)
  let validationError = selectionError
  let calls: Hex[] = []

  if (catalog.data && recordData && !validationError) {
    try {
      if (mode === 'copy' && !hasCompleteRecords) {
        throw new Error('Load all additional records before copying this configuration.')
      }

      if (
        !catalog.data.canLink &&
        (mode !== 'shared' ? catalog.data.linkedRecordId !== BigInt(0) : selectedId !== catalog.data.linkedRecordId)
      ) {
        throw new Error('You need link permission on this resolver to change this name’s configuration.')
      }

      calls = buildRecordCalls({
        records,
        mode,
        selectedId,
        linkedId: catalog.data.linkedRecordId,
        dnsName: dnsEncodeName(name),
      })
    } catch (error) {
      validationError = errorText(error)
    }
  }

  const canSave =
    !!address &&
    !isBusy &&
    !pending &&
    !isAdding &&
    !isLoading &&
    !loadError &&
    !validationError &&
    hasChanges &&
    calls.length > 0

  const updateRecord = (key: string, value: string) => {
    setDraft({
      key: viewKey,
      rows: records.map((row) => (recordKey(row) === key && row.editable ? { ...row, value } : row)),
    })
  }

  const changeView = (nextMode: V2RecordMode, nextSelection = selected) => {
    if (
      records.some((row) => row.value !== row.initialValue) &&
      !window.confirm('Discard your unsaved record changes?')
    )
      return
    setMode(nextMode)
    setSelection(nextSelection)
    setDraft(null)
    setError(null)
  }

  const addRecord = async (field: V2RecordField) => {
    if (!catalog.data || !resolver || isAdding) return false
    const key = viewKey

    try {
      const valid = validateRecordField(field)
      if (records.some((row) => recordKey(row) === recordKey(valid))) throw new Error('That record is already shown.')

      setIsAdding(true)
      const rows = await readConfiguration({
        client,
        resolver,
        catalog: catalog.data,
        name,
        selectedId,
        account: address,
        extraFields: [valid],
      })

      if (activeView.current !== key) return false

      const added = rows.find((row) => recordKey(row) === recordKey(valid))!

      if (mode === 'new') added.value = ''
      if (mode !== 'shared') added.initialValue = ''

      setDraft((previous) => ({
        key,
        rows: [...(previous?.key === key ? previous.rows : records), added],
      }))
      setError(null)

      return true
    } catch (error) {
      if (activeView.current === key) setError(errorText(error))
      return false
    } finally {
      setIsAdding(false)
    }
  }

  const track = (write: PendingWrite | null) => {
    pendingRef.current = write
    setPending(write)
    if (write) {
      setTxHash(write.hash)
      setStep('processing')
    }
  }

  const discardChanges = () => {
    setDraft(null)
    setSelection(null)
    setMode('shared')
  }

  const refresh = async () => {
    discardChanges()
    await queryClient.invalidateQueries({ queryKey: ['v2-records'] })
  }

  const completed = async (kind: PendingWrite['kind']) => {
    track(null)
    // Shared configurations can affect names other than the one that opened this modal.
    for (const key of [['name'], ['profile'], ['profileMetadata'], ['user', 'resolvers']] as const) {
      void queryClient.invalidateQueries({ queryKey: key })
    }
    void invalidateNameMetadataCache(name).catch(() => {})
    if (kind === 'records') {
      setDraft(null)
      setSelection(null)
      setMode('shared')
      dispatch(markImageForRefresh(name))
      void queryClient.invalidateQueries({ queryKey: ['v2-records'] })
      setStep('success')
    } else if (kind === 'resolver') {
      setResolverInput(null)
      await refresh()
      setStep('editing')
    } else {
      // A deployment does not replace the name's resolver or discard drafts in other tabs.
      setStep('editing')
    }
  }

  const confirmPending = async () => {
    const write = pendingRef.current
    if (!write) return
    if (write.kind === 'deploy') {
      // Check the receipt first so a reverted deployment does not remain "pending".
      const receipt = await waitForTransaction(client, write.hash)
      if (receipt.status !== 'success') {
        track(null)
        throw new Error('Resolver deployment reverted.')
      }
      const deployed = await getDeployedResolver(write.hash)
      setResolverInput(deployed)
      await completed('deploy')
    } else {
      const receipt = await waitForTransaction(client, write.hash)
      if (receipt.status !== 'success') {
        track(null)
        throw new Error('The transaction reverted. No changes from this transaction were saved.')
      }
      await completed(write.kind)
    }
  }

  const run = async (action: () => Promise<void>) => {
    if (busy.current) return

    busy.current = true
    setError(null)
    setStep('confirming')

    try {
      if (pendingRef.current) {
        setStep('processing')
        await confirmPending()
      } else await action()
    } catch (error) {
      setError(errorText(error))
      setStep('error')
    } finally {
      busy.current = false
    }
  }

  const getWallet = async () => {
    const wallet = await getWalletClient()
    if (!address || wallet.account.address.toLowerCase() !== address.toLowerCase())
      throw new Error('The connected wallet changed. Reopen this editor.')
    await ensureChain(wallet, activeChain.id)
    return wallet
  }

  const save = () =>
    run(async () => {
      setOperation('records')
      if (!canSave || !catalog.data || !binding.data || !resolver)
        throw new Error(validationError || 'Wait for the records to load before saving.')
      const wallet = await getWallet()
      const fresh = await readNameResolver(client, name, config.ensV2Registry, wallet.account.address)
      if (fresh.resolver.toLowerCase() !== resolver.toLowerCase())
        throw new Error('This name’s resolver changed. Reload the editor before saving.')
      const [linkedId, rootId] = await Promise.all([
        client.readContract({
          address: resolver,
          abi: PERMISSIONED_RESOLVER_ABI,
          functionName: 'getRecordId',
          args: [namehash(normalize(name))],
        }),
        client.readContract({
          address: resolver,
          abi: PERMISSIONED_RESOLVER_ABI,
          functionName: 'getRecordId',
          args: [zeroHash],
        }),
      ])
      if (linkedId !== catalog.data.linkedRecordId || rootId !== catalog.data.defaultRecordId) {
        throw new Error('The configuration links changed. Reload the editor before saving.')
      }
      const request = {
        address: resolver,
        abi: PERMISSIONED_RESOLVER_ABI,
        functionName: 'multicall',
        args: [calls],
        account: wallet.account.address,
        chain: activeChain,
      } as const
      await client.simulateContract(request)
      const hash = await wallet.writeContract(request)
      track({ hash, kind: 'records', sender: wallet.account.address })
      await confirmPending()
    })

  const effectiveResolverInput = resolverInput ?? (resolverExists ? resolver! : '')
  const initialResolverInput = resolverExists ? resolver! : ''
  const hasResolverChanges =
    resolverInput !== null && resolverInput.toLowerCase() !== initialResolverInput.toLowerCase()

  const useResolver = () =>
    run(async () => {
      setOperation('resolver')
      if (!isAddress(effectiveResolverInput) || effectiveResolverInput === zeroAddress)
        throw new Error('Enter a non-zero resolver contract address.')
      const wallet = await getWallet()
      const fresh = await readNameResolver(client, name, config.ensV2Registry, wallet.account.address)
      if (!fresh.canSetResolver) throw new Error('You do not have permission to change this name’s resolver.')
      if (
        binding.data &&
        (fresh.registry.toLowerCase() !== binding.data.registry.toLowerCase() ||
          fresh.directResolver.toLowerCase() !== binding.data.directResolver.toLowerCase())
      ) {
        throw new Error('This name’s registry or resolver changed. Reload the editor before continuing.')
      }
      const code = await client.getCode({ address: effectiveResolverInput })
      if (!code || code === '0x') throw new Error(`No resolver contract exists at this address on ${activeChain.name}.`)
      const request = {
        address: fresh.registry,
        abi: REGISTRY_V2_ABI,
        functionName: 'setResolver',
        args: [BigInt(labelhash(normalize(name).split('.')[0])), effectiveResolverInput],
        account: wallet.account.address,
        chain: activeChain,
      } as const
      await client.simulateContract(request)
      const hash = await wallet.writeContract(request)
      track({ hash, kind: 'resolver', sender: wallet.account.address })
      await confirmPending()
    })

  const deployNewResolver = () =>
    run(async () => {
      setOperation('deploy')
      if (!address) throw new Error('Connect your wallet before deploying a resolver.')
      const deployedAddress = await deployResolver(newResolverVersion(), (hash) =>
        track({ hash, kind: 'deploy', sender: address })
      )
      setResolverInput(deployedAddress)
      await completed('deploy')
      // Deployment and registry assignment are separate transactions.
    })

  return {
    records,
    updateRecord,
    addRecord,
    isAdding,
    mode,
    changeView,
    selected,
    selectedId,
    binding: binding.data,
    catalog: catalog.data,
    resolvers:
      resolverExists && !resolvers.data?.some((item) => item.address.toLowerCase() === resolver.toLowerCase())
        ? [{ address: resolver, name: null }, ...(resolvers.data ?? [])]
        : (resolvers.data ?? []),
    hasCompleteRecords,
    isDiscovering: history.isFetching || discoveredRecords.isFetching,
    discoveryError: discoveryError ? errorText(discoveryError) : null,
    retryDiscovery: () => (history.isError ? history.refetch() : discoveredRecords.refetch()),
    resolverInput: effectiveResolverInput,
    setResolverInput,
    useResolver,
    deployNewResolver,
    hasResolverChanges,
    operation,
    resolverExists,
    isLoading,
    loadError: loadError ? errorText(loadError) : null,
    validationError,
    hasChanges,
    discardChanges,
    canSave,
    save,
    step,
    error,
    txHash,
    pending,
    isBusy,
    refresh,
    retry: () => (pending ? run(confirmPending) : setStep('editing')),
    explorerUrl: txHash ? `${activeChain.blockExplorers.default.url}/tx/${txHash}` : null,
  }
}
