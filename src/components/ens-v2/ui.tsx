'use client'

import { useState, type ReactNode } from 'react'
import type { Address } from 'viem'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ensApi } from '@/api/ens-v2'
import { activeChain, EXPLORER_URL } from '@/constants/web3/chain'
import type { useResolverOperation } from '@/hooks/ens-v2/useResolverOperation'

export const inputClass =
  'border-tertiary bg-secondary w-full rounded-md border px-3 py-2.5 outline-none focus:border-primary disabled:opacity-50'
export const buttonClass =
  'border-tertiary hover:bg-tertiary rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className='flex flex-col gap-1.5 text-sm'>
      <span className='text-neutral'>{label}</span>
      {children}
    </label>
  )
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={`rounded-md border p-3 text-sm ${error ? 'border-red-400/30 bg-red-400/10 text-red-300' : 'border-tertiary bg-secondary text-neutral'}`}
    >
      {children}
    </div>
  )
}

export function AddressLabel({ address }: { address: Address }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className='inline-flex items-center gap-2 text-sm'>
      <a
        className='text-neutral font-mono hover:underline'
        href={`${EXPLORER_URL}/address/${address}`}
        target='_blank'
        rel='noreferrer'
        title={address}
      >
        {address.slice(0, 8)}…{address.slice(-6)}
      </a>
      <button
        type='button'
        className='text-neutral hover:text-foreground'
        aria-label={`Copy ${address}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(address)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            setCopied(false)
          }
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  )
}

export function PersonalLabel({
  resolver,
  recordId,
  initial,
}: {
  resolver: Address
  recordId?: string
  initial: string | null
}) {
  const [value, setValue] = useState(initial ?? '')
  const cache = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => ensApi.label(activeChain.id, resolver, value.trim() || null, recordId),
    onSuccess: () => cache.invalidateQueries({ queryKey: ['ens-v2'] }),
  })
  return (
    <div className='flex flex-col gap-2'>
      <Field label='Your label (visible only to this wallet)'>
        <input
          className={inputClass}
          value={value}
          maxLength={100}
          onChange={(event) => setValue(event.target.value)}
          placeholder={recordId ? `Configuration ${recordId}` : 'Resolver label'}
        />
      </Field>
      <button
        className={`${buttonClass} self-start`}
        disabled={mutation.isPending || value.trim() === (initial ?? '')}
        onClick={() => mutation.mutate()}
      >
        Save label
      </button>
      {mutation.error && <Notice error>{mutation.error.message}</Notice>}
    </div>
  )
}

export function OperationStatus({ operation }: { operation: ReturnType<typeof useResolverOperation> }) {
  return (
    <>
      {operation.isPending && (
        <Notice>
          {operation.hash ? 'Transaction submitted. Waiting for confirmation…' : 'Review and confirm in your wallet…'}
        </Notice>
      )}
      {operation.hash && (
        <a
          href={`${EXPLORER_URL}/tx/${operation.hash}`}
          target='_blank'
          rel='noreferrer'
          className='text-primary text-sm underline'
        >
          View transaction
        </a>
      )}
      {operation.error && <Notice error>{operation.error.message}</Notice>}
      {operation.isSuccess && !operation.syncWarning && (
        <Notice>Confirmed onchain. Configuration data is refreshing.</Notice>
      )}
      {operation.syncWarning && <Notice>{operation.syncWarning}</Notice>}
      {operation.unconfirmed && !operation.isPending && (
        <Notice>A submitted transaction needs confirmation. Open Settings to recover it before retrying.</Notice>
      )}
    </>
  )
}
