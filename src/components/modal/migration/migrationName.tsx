'use client'

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isAddress, isAddressEqual, type Address, type Hex } from 'viem'
import { activeChain, EXPLORER_URL } from '@/constants/web3/chain'
import { NFT_ABI } from '@/constants/abi/NFTAbi'
import { MIGRATION_HELPER_ABI, ENS_V2_RESOLVER_ABI } from '@/constants/abi/ENSv2'
import { useDraftGuard } from '@/hooks/ens-v2/useDraftGuard'
import { useEnsV2 } from '@/hooks/useEnsV2'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { useConfigurations, useResolver, resolverKey } from '@/hooks/ens-v2/useResolverData'
import { ensApi } from '@/api/ens-v2'
import { getV2Name } from '@/utils/web3/ensv2'
import { checkMigration, migrationApprovals, migrationBatches } from '@/utils/web3/ensMigration'
import { readNameRecords, readConfigurationRecords } from '@/utils/web3/resolver-reads'
import { recordChanges } from '@/utils/web3/resolver-records'
import {
  anchorNode,
  dnsName,
  linkCall,
  requireSupportedResolver,
  sendResolverCalls,
  setNameResolver,
  requireNameResolverPermission,
} from '@/utils/web3/resolver-transactions'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { rememberEnsTransaction, forgetEnsTransaction } from '@/utils/web3/transaction-journal'
import type { Configuration, NameRecordSnapshot, RecordValue } from '@/types/ens-v2'
import ResolverPicker from '@/components/ens-v2/resolverPicker'
import CreateConfiguration from '@/components/ens-v2/createConfiguration'
import { buttonClass, inputClass, Field, Notice } from '@/components/ens-v2/ui'

type Recovery = {
  resolver: Address
  recordId: string
  source: NameRecordSnapshot
  copied: boolean
  records: RecordValue[]
  hashes: Hex[]
  pending?: Hex
  linked?: boolean
  migrated?: boolean
}

export default function MigrationName({ name }: { name: string }) {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: activeChain.id })
  const v2 = useEnsV2()
  const getWallet = useGetWalletClient()
  const cache = useQueryClient()
  const storageKey = `grails:ens-migration:${activeChain.id}:${address?.toLowerCase()}:${name}`
  const [recovery, setRecovery] = useState<Recovery | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [destination, setDestination] = useState('')
  const [recordId, setRecordId] = useState('')
  const [mode, setMode] = useState<'copy' | 'empty' | 'existing'>('copy')
  const [acknowledge, setAcknowledge] = useState(false)
  const [additionalKey, setAdditionalKey] = useState('')
  const [extraRecords, setExtraRecords] = useState<RecordValue[]>([])
  const [preparedRecords, setPreparedRecords] = useState<RecordValue[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  useDraftGuard(false, busy)
  const saveRecovery = (value: Recovery) => {
    setRecovery(value)
    try {
      localStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      /* Keep the in-memory recovery if browser storage is unavailable. */
    }
  }
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as Recovery
        if (
          isAddress(parsed.resolver) &&
          /^[1-9][0-9]*$/.test(parsed.recordId) &&
          parsed.source?.name === name &&
          Array.isArray(parsed.source.records) &&
          Array.isArray(parsed.records) &&
          Array.isArray(parsed.hashes)
        )
          setRecovery(parsed)
      }
    } catch {
      /* No usable recovery. */
    }
    setLoaded(true)
  }, [storageKey])
  const preflight = useQuery({
    queryKey: [...resolverKey(address), 'migration', name],
    enabled: !!client && !!v2 && !!address,
    retry: false,
    queryFn: async () => {
      const migrated = await getV2Name(client!, v2!, name)
      if (migrated) return { migrated: true, candidate: null }
      const result = (await checkMigration(client!, v2!, address!, [name]))[0]
      if ('issue' in result) throw new Error(result.issue)
      if (result.resolverLocked)
        throw new Error(
          'This name has a permanently locked resolver. Migration can substitute a PublicResolverV2 and requires a dedicated record-preservation flow; this assistant cannot safely change its resolver.'
        )
      return { migrated: false, candidate: result }
    },
  })
  const source = useQuery({
    queryKey: [...resolverKey(address), 'migration-records', name],
    enabled: loaded && !recovery && !!client && !!address && preflight.isSuccess,
    retry: false,
    queryFn: async () => {
      const snapshot = await ensApi.nameRecords(activeChain.id, name)
      if (!client) throw new Error('The RPC client is unavailable.')
      return { ...snapshot, records: await readNameRecords(client, name, snapshot.records) }
    },
  })
  const target = recovery?.resolver ?? destination
  const resolver = useResolver(isAddress(target) ? target : undefined)
  const configurations = useConfigurations(isAddress(target) ? target : undefined)
  const snapshot = recovery?.source ?? source.data
  const copyRecords = recovery?.records ?? [...(snapshot?.records ?? []), ...extraRecords]
  const sourceConfiguration: Configuration | undefined = snapshot
    ? {
        chainId: activeChain.id,
        resolver: snapshot.resolver,
        recordId: '1',
        label: null,
        recordCount: copyRecords.length,
        nameCount: 1,
        explicitNameCount: 1,
        defaultNameCount: 0,
        isDefault: false,
        anchor: null,
        records: copyRecords,
        recordsComplete: snapshot.complete || acknowledge,
        index: { indexedThroughBlock: snapshot.indexedThroughBlock, complete: snapshot.complete },
      }
    : undefined
  const execute = async () => {
    if (!client || !v2 || !address || !snapshot || !isAddress(target) || !(recovery?.recordId || recordId)) return
    setBusy(true)
    setError(null)
    let saved: Recovery = recovery ?? {
      resolver: target,
      recordId,
      source: { ...snapshot, records: copyRecords },
      copied: mode === 'copy',
      records: preparedRecords ?? copyRecords,
      hashes: [],
    }
    const onHash = (hash: Hex) => {
      saved = { ...saved, pending: hash, hashes: [...saved.hashes, hash] }
      saveRecovery(saved)
      rememberEnsTransaction({ hash, chainId: activeChain.id, wallet: address, submittedAt: Date.now() })
    }
    const settle = async (hash: Hex) => {
      const receipt = await waitForTransaction(client, hash)
      forgetEnsTransaction(hash)
      saved = { ...saved, pending: undefined }
      saveRecovery(saved)
      if (receipt.status !== 'success')
        throw new Error('The transaction reverted. Confirmed earlier steps are preserved.')
      await ensApi.refresh(activeChain.id, receipt.transactionHash).catch(() => undefined)
      return receipt
    }
    try {
      const wallet = await getWallet()
      if (!isAddressEqual(wallet.account.address, address))
        throw new Error('Reconnect the wallet that started this migration.')
      await ensureChain(wallet, activeChain.id)
      saveRecovery(saved)
      if (saved.pending) {
        setStage('Checking the previous transaction')
        await settle(saved.pending)
      }
      let migrated = !!(await getV2Name(client, v2, name))
      if (!migrated && saved.copied) {
        setStage('Checking source records')
        const current = await readNameRecords(client, name, saved.source.records)
        if (recordChanges(saved.source.records, current).length)
          throw new Error(
            'Source records changed since the copy was prepared. Update the destination configuration before proceeding.'
          )
      }
      await requireSupportedResolver(client, v2, saved.resolver)
      if (migrated && !saved.migrated) {
        const context = await ensApi.name(activeChain.id, name)
        if (context.version !== 'v2')
          throw new Error(
            'Token migration is confirmed. Waiting for the name index before configuring its resolver; continue again when it refreshes.'
          )
        await requireNameResolverPermission(client, v2, address, context, saved.resolver)
      }
      setStage('Assigning the destination configuration')
      const currentId = await client.readContract({
        address: saved.resolver,
        abi: ENS_V2_RESOLVER_ABI,
        functionName: 'getRecordId',
        args: [anchorNode(dnsName(name))],
      })
      if (currentId.toString() !== saved.recordId) {
        const linked = await sendResolverCalls(
          client,
          wallet,
          saved.resolver,
          [linkCall(dnsName(name), saved.recordId)],
          onHash
        )
        await settle(linked.transactionHash)
      }
      saved = { ...saved, linked: true }
      saveRecovery(saved)
      if (saved.copied) {
        const destinationRecords = await readConfigurationRecords(client, saved.resolver, dnsName(name), saved.records)
        if (recordChanges(saved.records, destinationRecords).length)
          throw new Error('The destination records changed. Review that configuration before migrating the token.')
      }
      if (!migrated) {
        const fresh = (await checkMigration(client, v2, address, [name]))[0]
        if ('issue' in fresh || fresh.resolverLocked)
          throw new Error('Migration eligibility changed. Refresh the review before continuing.')
        const candidate = { ...fresh, data: { ...fresh.data, resolver: saved.resolver } }
        for (const contract of await migrationApprovals(client, v2, address, [candidate])) {
          setStage('Approving the migration helper')
          const hash = await wallet.writeContract({
            address: contract,
            abi: NFT_ABI,
            functionName: 'setApprovalForAll',
            args: [v2.migrationHelper, true],
            chain: activeChain,
          })
          onHash(hash)
          await settle(hash)
        }
        setStage('Migrating the name token')
        const args = migrationBatches([candidate])[0]
        await client.simulateContract({
          address: v2.migrationHelper,
          abi: MIGRATION_HELPER_ABI,
          functionName: 'migrate',
          args,
          account: wallet.account,
        })
        const hash = await wallet.writeContract({
          address: v2.migrationHelper,
          abi: MIGRATION_HELPER_ABI,
          functionName: 'migrate',
          args,
          chain: activeChain,
        })
        onHash(hash)
        await settle(hash)
        saved = { ...saved, migrated: true }
        saveRecovery(saved)
        migrated = true
      } else {
        setStage('Setting the name’s resolver')
        const context = await ensApi.name(activeChain.id, name)
        if (!isAddressEqual(context.resolver, saved.resolver)) {
          const receipt = await setNameResolver(client, wallet, context, saved.resolver, onHash, v2)
          await settle(receipt.transactionHash)
        }
      }
      setStage('Verifying resolution')
      if (saved.copied) {
        const resolved = await readNameRecords(client, name, saved.records)
        if (recordChanges(saved.records, resolved).length)
          throw new Error(
            'Migration confirmed, but the copied records do not match resolution. Review the destination configuration before retrying setup.'
          )
      }
      if (migrated) setSuccess(true)
      await Promise.all([
        cache.invalidateQueries({ queryKey: ['name'] }),
        cache.invalidateQueries({ queryKey: ['ens-v2'] }),
        cache.invalidateQueries({ queryKey: ['profile'] }),
      ])
      try {
        localStorage.removeItem(storageKey)
      } catch {
        /* Completed. */
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Migration failed.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className='border-tertiary flex flex-col gap-4 rounded-lg border p-4'>
      <h3 className='text-lg font-semibold'>{name}</h3>
      {preflight.isPending && <Notice>Checking ownership, migration state and restrictions…</Notice>}
      {preflight.error && <Notice error>{preflight.error.message}</Notice>}
      {preflight.data && source.isPending && !recovery && <Notice>Loading known source records…</Notice>}
      {source.error && <Notice error>{source.error.message}</Notice>}
      {success ? (
        <Notice>Migration and destination configuration confirmed.</Notice>
      ) : (
        preflight.data &&
        snapshot && (
          <>
            <Notice>
              {preflight.data.migrated
                ? 'This name is already on ENSv2. Only its resolver and records need setup.'
                : 'Prepare the destination records before transferring the V1 token. Existing marketplace approvals and listings will need updating after migration.'}{' '}
              {snapshot.records.length} known source records.{' '}
              {snapshot.complete
                ? 'The index reports complete record coverage.'
                : 'Record enumeration is incomplete; unknown keys may be missing.'}
            </Notice>
            {snapshot.warnings.map((warning) => (
              <Notice key={warning}>{warning}</Notice>
            ))}
            {!snapshot.complete && !recovery && (
              <label className='flex gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={acknowledge}
                  onChange={(event) => setAcknowledge(event.target.checked)}
                />
                I reviewed the known records and understand that undiscovered records will not be copied.
              </label>
            )}
            {!recovery && (
              <>
                <details>
                  <summary className='cursor-pointer'>Inspect source records</summary>
                  <dl className='mt-2 flex flex-col gap-2'>
                    {copyRecords.map((record, index) => (
                      <div key={index}>
                        <dt className='text-neutral text-sm'>
                          {record.type}
                          {'key' in record ? `: ${record.key}` : 'coinType' in record ? `: ${record.coinType}` : ''}
                        </dt>
                        <dd className='text-sm break-all'>{record.value || '(empty)'}</dd>
                      </div>
                    ))}
                  </dl>
                  <Field label='Additional known text key'>
                    <input
                      className={inputClass}
                      value={additionalKey}
                      onChange={(event) => setAdditionalKey(event.target.value)}
                    />
                  </Field>
                  <button
                    className={buttonClass}
                    onClick={async () => {
                      if (
                        !client ||
                        !additionalKey ||
                        copyRecords.some((record) => record.type === 'text' && record.key === additionalKey)
                      )
                        return
                      try {
                        const records = await readNameRecords(client, name, [
                          { type: 'text', key: additionalKey, value: '' },
                        ])
                        setExtraRecords([...extraRecords, ...records])
                        setRecordId('')
                        setPreparedRecords(null)
                        setAdditionalKey('')
                      } catch (cause) {
                        setError(cause instanceof Error ? cause.message : 'Could not read key.')
                      }
                    }}
                  >
                    Read key
                  </button>
                </details>
                <ResolverPicker
                  value={destination}
                  onChange={(value) => {
                    setDestination(value)
                    setRecordId('')
                  }}
                />
                <Field label='Destination records'>
                  <select
                    className={inputClass}
                    value={mode}
                    onChange={(event) => {
                      setMode(event.target.value as typeof mode)
                      setRecordId('')
                    }}
                  >
                    <option value='copy'>Copy known source records to a new configuration</option>
                    <option value='empty'>Create an empty configuration</option>
                    <option value='existing'>Use an existing configuration</option>
                  </select>
                </Field>
                {resolver.error && <Notice error>{resolver.error.message}</Notice>}
                {resolver.data?.supported &&
                  (snapshot.complete || acknowledge) &&
                  (mode === 'existing' ? (
                    <>
                      <Field label='Configuration'>
                        <select
                          className={inputClass}
                          value={recordId}
                          onChange={(event) => setRecordId(event.target.value)}
                        >
                          <option value=''>Choose configuration</option>
                          {configurations.data?.pages
                            .flatMap((page) => page.items)
                            .map((item) => (
                              <option key={item.recordId} value={item.recordId}>
                                {item.label || `Configuration ${item.recordId}`}
                              </option>
                            ))}
                        </select>
                      </Field>
                      {configurations.hasNextPage && (
                        <button className={buttonClass} onClick={() => configurations.fetchNextPage()}>
                          Load more
                        </button>
                      )}
                    </>
                  ) : (
                    <CreateConfiguration
                      key={`${mode}:${destination}:${extraRecords.length}`}
                      resolver={resolver.data}
                      source={mode === 'copy' ? sourceConfiguration : undefined}
                      onCreated={(id, records) => {
                        setRecordId(id)
                        setPreparedRecords(records)
                      }}
                    />
                  ))}
              </>
            )}
            {(recordId || recovery) && (
              <Notice>
                Destination: {target}, Configuration {recovery?.recordId || recordId}.{' '}
                {mode !== 'copy' && !recovery
                  ? 'The name will use the selected configuration instead of its existing records.'
                  : ''}{' '}
                Execution links the configuration, obtains required token approvals, migrates if needed, and verifies
                copied records.
              </Notice>
            )}
            <button
              className={buttonClass}
              disabled={busy || !(recordId || recovery?.recordId) || (!snapshot.complete && !acknowledge && !recovery)}
              onClick={execute}
            >
              {busy ? stage : recovery ? 'Continue remaining migration steps' : 'Confirm migration and configuration'}
            </button>
          </>
        )
      )}
      {recovery?.hashes.map((hash) => (
        <a
          key={hash}
          className='text-primary text-sm underline'
          href={`${EXPLORER_URL}/tx/${hash}`}
          target='_blank'
          rel='noreferrer'
        >
          View transaction {hash.slice(0, 10)}…
        </a>
      ))}
      {error && <Notice error>{error}</Notice>}
    </section>
  )
}
