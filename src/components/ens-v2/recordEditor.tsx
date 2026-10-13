'use client'

import { useMemo, useState } from 'react'
import type { Address, Hex } from 'viem'
import type { RecordValue, RoleGrant } from '@/types/ens-v2'
import { recordIdentity } from '@/types/ens-v2'
import { canEditRecord } from '@/utils/web3/resolver-permissions'
import { displayRecordValue, normalizedRecord } from '@/utils/web3/resolver-records'
import { useDraftGuard } from '@/hooks/ens-v2/useDraftGuard'
import { buttonClass, Field, inputClass, Notice } from './ui'

type Row = { id: number; record: RecordValue; existing: boolean }
const templates: Record<RecordValue['type'], RecordValue> = {
  text: { type: 'text', key: '', value: '' },
  address: { type: 'address', coinType: '60', value: '' },
  contenthash: { type: 'contenthash', value: '' },
  name: { type: 'name', value: '' },
  abi: { type: 'abi', contentType: '1', value: '' },
  interface: { type: 'interface', interfaceId: '0x00000000', value: '0x0000000000000000000000000000000000000000' },
  data: { type: 'data', key: '', value: '' },
}
const labels = {
  text: 'Text',
  address: 'Address',
  contenthash: 'Content hash',
  name: 'Name record',
  abi: 'ABI (advanced)',
  interface: 'Interface (advanced)',
  data: 'Raw data (advanced)',
}

export default function RecordEditor({
  initial,
  grants,
  account,
  onSave,
  busy,
  saveLabel = 'Review and save',
  readOnly = false,
  allowEmpty = false,
}: {
  initial: RecordValue[]
  grants: RoleGrant[]
  account?: Address
  onSave: (records: RecordValue[]) => Promise<void> | void
  busy: boolean
  saveLabel?: string
  readOnly?: boolean
  allowEmpty?: boolean
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map((record, id) => ({ id, existing: true, record: { ...record, value: displayRecordValue(record) } }))
  )
  const [type, setType] = useState<RecordValue['type']>('text')
  const [error, setError] = useState<string | null>(null)
  const [review, setReview] = useState(false)
  const initialValues = useMemo(
    () => new Map(initial.map((record) => [recordIdentity(record), normalizedRecord(record).value])),
    [initial]
  )
  const dirty = rows.some((row) => {
    try {
      return initialValues.get(recordIdentity(row.record)) !== normalizedRecord(row.record).value
    } catch {
      return true
    }
  })
  useDraftGuard(dirty && !readOnly, busy)
  const update = (id: number, patch: Partial<RecordValue>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, record: { ...row.record, ...patch } as RecordValue } : row))
    )
    setReview(false)
  }
  const save = async () => {
    setError(null)
    try {
      const values = rows.map(({ record }) => normalizedRecord(record))
      const keys = values.map(recordIdentity)
      if (new Set(keys).size !== keys.length) throw new Error('Each record type and key can appear only once.')
      for (const record of values) {
        if (initialValues.get(recordIdentity(record)) !== record.value && !canEditRecord(grants, account, record))
          throw new Error(`This wallet cannot edit ${recordIdentity(record)}.`)
      }
      if (!review) {
        setReview(true)
        return
      }
      await onSave(values)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save records.')
    }
  }
  return (
    <div className='flex flex-col gap-4'>
      {rows.length === 0 && (
        <Notice>
          This configuration has no records.
          {allowEmpty && ' You can create it empty; names assigned to it will not use the resolver defaults.'}
        </Notice>
      )}
      {rows.map(({ id, record, existing }) => {
        const allowed = !readOnly && canEditRecord(grants, account, record)
        return (
          <div key={id} className='border-tertiary flex flex-col gap-3 rounded-lg border p-4'>
            <div className='flex items-center justify-between gap-2'>
              <span className='font-medium'>{labels[record.type]}</span>
              {!readOnly && (
                <button
                  className='text-neutral text-xs underline'
                  disabled={busy || (existing && !allowed)}
                  onClick={() =>
                    existing
                      ? update(id, {
                          value: record.type === 'interface' ? '0x0000000000000000000000000000000000000000' : '',
                        })
                      : setRows((current) => current.filter((row) => row.id !== id))
                  }
                >
                  {existing ? 'Clear value' : 'Remove field'}
                </button>
              )}
            </div>
            {'key' in record && (
              <Field label={record.type === 'text' ? 'Text key' : 'Data key'}>
                <input
                  className={inputClass}
                  disabled={existing || busy || readOnly}
                  value={record.key}
                  placeholder='avatar, description, com.twitter…'
                  onChange={(event) => update(id, { key: event.target.value })}
                />
              </Field>
            )}
            {record.type === 'address' && (
              <Field label='Coin type (60 = Ethereum, 0 = Bitcoin, 501 = Solana)'>
                <input
                  className={inputClass}
                  disabled={existing || busy || readOnly}
                  value={record.coinType}
                  onChange={(event) => update(id, { coinType: event.target.value })}
                />
              </Field>
            )}
            {record.type === 'abi' && (
              <Field label='ABI content type (1, 2, 4, 8…)'>
                <input
                  className={inputClass}
                  disabled={existing || busy || readOnly}
                  value={record.contentType}
                  onChange={(event) => update(id, { contentType: event.target.value })}
                />
              </Field>
            )}
            {record.type === 'interface' && (
              <Field label='Interface ID (bytes4)'>
                <input
                  className={inputClass}
                  disabled={existing || busy || readOnly}
                  value={record.interfaceId}
                  onChange={(event) => update(id, { interfaceId: event.target.value as Hex })}
                />
              </Field>
            )}
            <Field label={record.type === 'data' || record.type === 'abi' ? 'Value (hexadecimal bytes)' : 'Value'}>
              <textarea
                className={`${inputClass} min-h-20 resize-y`}
                disabled={busy || !allowed}
                value={record.value}
                onChange={(event) => update(id, { value: event.target.value })}
                placeholder={record.type === 'contenthash' ? 'ipfs://…' : undefined}
              />
            </Field>
            {!allowed && (
              <p className='text-neutral text-xs'>
                {readOnly ? 'Read only.' : 'Your current permissions do not allow editing this field.'}
              </p>
            )}
            {record.type === 'name' && (
              <p className='text-neutral text-xs'>
                This is the bundle’s name record. Set your wallet’s primary ENS name in Profile details.
              </p>
            )}
          </div>
        )
      })}
      {!readOnly && (
        <>
          <div className='flex items-end gap-2'>
            <Field label='Add records'>
              <select
                className={inputClass}
                value={type}
                disabled={busy}
                onChange={(event) => setType(event.target.value as RecordValue['type'])}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <button
              className={buttonClass}
              disabled={busy}
              onClick={() => {
                setRows((current) => [
                  ...current,
                  {
                    id: Math.max(-1, ...current.map((row) => row.id)) + 1,
                    existing: false,
                    record: { ...templates[type] },
                  },
                ])
                setReview(false)
              }}
            >
              Add
            </button>
          </div>
          {review && (
            <Notice>
              Save these values to this configuration onchain. Every name using this configuration will receive the
              updated values.
            </Notice>
          )}
          {error && <Notice error>{error}</Notice>}
          <button
            className={`${buttonClass} border-primary! text-primary self-start`}
            disabled={busy || (!dirty && !allowEmpty)}
            onClick={save}
          >
            {busy ? 'Waiting for transaction…' : review ? 'Confirm changes' : saveLabel}
          </button>
        </>
      )}
    </div>
  )
}
