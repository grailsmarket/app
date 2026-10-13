'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { encodeFunctionData, isAddress, type Hex } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { ensApi } from '@/api/ens-v2'
import { activeChain } from '@/constants/web3/chain'
import { ENS_V2_RESOLVER_ABI as abi } from '@/constants/abi/ENSv2'
import {
  adminRole,
  ALL_RESOLVER_ROLES,
  hasPermission,
  recordPermission,
  RESOLVER_ROLES,
} from '@/utils/web3/resolver-permissions'
import { encodeSetter } from '@/utils/web3/resolver-records'
import { requireSupportedResolver, sendResolverCalls } from '@/utils/web3/resolver-transactions'
import { useResolverOperation } from '@/hooks/ens-v2/useResolverOperation'
import { resolverKey } from '@/hooks/ens-v2/useResolverData'
import type { RecordValue, ResolverSummary, RoleGrant } from '@/types/ens-v2'
import { AddressLabel, buttonClass, Field, inputClass, Notice, OperationStatus } from './ui'

function grantDescription(grant: RoleGrant) {
  const bits = BigInt(grant.roles)
  return Object.entries(RESOLVER_ROLES)
    .flatMap(([label, role]) => [bits & role ? label : '', bits & adminRole(role) ? `${label} admin` : ''])
    .filter(Boolean)
    .join(', ')
}

export default function ResolverRoles({ resolver }: { resolver: ResolverSummary }) {
  const { address } = useAccount()
  const roles = useQuery({
    queryKey: [...resolverKey(address), 'roles', resolver.address],
    queryFn: () => ensApi.roles(activeChain.id, resolver.address),
    retry: false,
  })
  const [recipient, setRecipient] = useState('')
  const [role, setRole] = useState<keyof typeof RESOLVER_ROLES | 'full'>('text')
  const [scope, setScope] = useState<'root' | 'argument'>('root')
  const [argument, setArgument] = useState('')
  const [includeAdmin, setIncludeAdmin] = useState(false)
  const [review, setReview] = useState<{ calls: Hex[]; description: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const operation = useResolverOperation()
  const prepareGrant = () => {
    setError(null)
    try {
      if (!isAddress(recipient)) throw new Error('Enter the wallet address receiving access.')
      const bitmap =
        role === 'full'
          ? ALL_RESOLVER_ROLES
          : RESOLVER_ROLES[role] | (includeAdmin ? adminRole(RESOLVER_ROLES[role]) : BigInt(0))
      if (scope === 'root') {
        const needed =
          role === 'full'
            ? Object.values(RESOLVER_ROLES).reduce((all, value) => all | adminRole(value), BigInt(0))
            : adminRole(RESOLVER_ROLES[role])
        if (!hasPermission(resolver.grants, address, needed))
          throw new Error('You do not have the administrator permissions for this grant.')
        setReview({
          calls: [encodeFunctionData({ abi, functionName: 'grantRootRoles', args: [bitmap, recipient] })],
          description: `Grant ${role === 'full' ? 'full control' : `${role}${includeAdmin ? ' and its admin role' : ''}`} across this entire resolver to ${recipient}.`,
        })
      } else {
        let record: RecordValue
        if (role === 'text' || role === 'data')
          record = { type: role, key: argument, value: role === 'text' ? '' : '0x' }
        else if (role === 'address') record = { type: 'address', coinType: argument, value: '0x' }
        else if (role === 'abi') record = { type: 'abi', contentType: argument, value: '0x' }
        else if (role === 'interface')
          record = {
            type: 'interface',
            interfaceId: argument as Hex,
            value: '0x0000000000000000000000000000000000000000',
          }
        else throw new Error('This permission is only available across the whole resolver.')
        const permission = recordPermission(record)
        if (!hasPermission(resolver.grants, address, adminRole(permission.role), permission.resource))
          throw new Error('You cannot administer this record permission.')
        setReview({
          calls: [
            encodeFunctionData({
              abi,
              functionName: 'grantSetterRoles',
              args: [encodeSetter('0x00', record), recipient],
            }),
          ],
          description: `Allow ${recipient} to edit ${role} ${argument} in every configuration in this resolver.`,
        })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Invalid grant.')
    }
  }
  const revoke = (grant: RoleGrant, bitmap: bigint) => {
    const needed = Object.values(RESOLVER_ROLES)
      .filter((role) => bitmap & (role | adminRole(role)))
      .reduce((bits, role) => bits | adminRole(role), BigInt(0))
    if (!hasPermission(resolver.grants, address, needed, BigInt(grant.resource))) {
      setError('You cannot revoke every role in this grant.')
      return
    }
    setReview({
      calls: [
        BigInt(grant.resource) === BigInt(0)
          ? encodeFunctionData({ abi, functionName: 'revokeRootRoles', args: [bitmap, grant.account] })
          : encodeFunctionData({
              abi,
              functionName: 'revokeRoles',
              args: [BigInt(grant.resource), bitmap, grant.account],
            }),
      ],
      description: `Remove ${grantDescription({ ...grant, roles: bitmap.toString() })} from ${grant.account}. Revoking the last administrator can permanently prevent granting these permissions again.`,
    })
  }
  return (
    <div className='flex flex-col gap-4'>
      <h3 className='text-xl font-semibold'>Access</h3>
      <p className='text-neutral text-sm'>
        Record permissions apply across every configuration in this resolver. Managing a domain’s resolver is a separate
        registry permission.
      </p>
      {roles.error && <Notice error>{roles.error.message}</Notice>}
      {roles.data?.map((grant) => (
        <div
          className='border-tertiary flex flex-wrap items-center justify-between gap-3 rounded-md border p-3'
          key={`${grant.account}:${grant.resource}`}
        >
          <div>
            <AddressLabel address={grant.account} />
            <p className='mt-1 text-sm'>{grantDescription(grant)}</p>
            <p className='text-neutral text-xs'>
              {BigInt(grant.resource) === BigInt(0) ? 'Whole resolver' : grant.argument || `Resource ${grant.resource}`}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {Object.entries(RESOLVER_ROLES).flatMap(([label, bit]) =>
              [bit, adminRole(bit)]
                .filter((value) => (BigInt(grant.roles) & value) !== BigInt(0))
                .map((value) => (
                  <button
                    key={value.toString()}
                    className={buttonClass}
                    disabled={
                      operation.isPending ||
                      !hasPermission(resolver.grants, address, adminRole(bit), BigInt(grant.resource))
                    }
                    onClick={() => revoke(grant, value)}
                  >
                    Revoke {label}
                    {value === adminRole(bit) ? ' admin' : ''}
                  </button>
                ))
            )}
          </div>
        </div>
      ))}
      <Field label='Wallet receiving access'>
        <input
          className={inputClass}
          value={recipient}
          onChange={(event) => {
            setRecipient(event.target.value)
            setReview(null)
          }}
        />
      </Field>
      <Field label='Permission'>
        <select
          className={inputClass}
          value={role}
          onChange={(event) => {
            setRole(event.target.value as typeof role)
            setReview(null)
          }}
        >
          <option value='full'>Full control</option>
          {Object.keys(RESOLVER_ROLES).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </Field>
      <Field label='Scope'>
        <select
          className={inputClass}
          value={scope}
          onChange={(event) => {
            setScope(event.target.value as typeof scope)
            setReview(null)
          }}
        >
          <option value='root'>Whole resolver</option>
          <option value='argument'>One key / coin type / content type / interface</option>
        </select>
      </Field>
      {scope === 'argument' ? (
        <Field label='Key or numeric argument'>
          <input
            className={inputClass}
            value={argument}
            onChange={(event) => {
              setArgument(event.target.value)
              setReview(null)
            }}
          />
        </Field>
      ) : (
        role !== 'full' && (
          <label className='flex items-center gap-2 text-sm'>
            <input
              type='checkbox'
              checked={includeAdmin}
              onChange={(event) => {
                setIncludeAdmin(event.target.checked)
                setReview(null)
              }}
            />
            Also allow managing this permission
          </label>
        )
      )}
      <button className={`${buttonClass} self-start`} disabled={operation.isPending} onClick={prepareGrant}>
        Review grant
      </button>
      {review && (
        <Notice>
          <p>{review.description}</p>
          <button
            className={`${buttonClass} mt-3`}
            disabled={operation.isPending}
            onClick={() =>
              operation.mutate(
                async ({ client, wallet, v2, onHash }) => {
                  await requireSupportedResolver(client, v2, resolver.address)
                  return { receipt: await sendResolverCalls(client, wallet, resolver.address, review.calls, onHash) }
                },
                { onSuccess: () => setReview(null) }
              )
            }
          >
            Confirm permission change
          </button>
        </Notice>
      )}
      {error && <Notice error>{error}</Notice>}
      <OperationStatus operation={operation} />
    </div>
  )
}
