'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'
import { type Address, type Hex, encodeAbiParameters, isAddress, stringToHex, zeroAddress } from 'viem'
import Input from '@/components/ui/input'
import Dropdown from '@/components/ui/dropdown'
import SecondaryButton from '@/components/ui/buttons/secondary'
import {
  roleErrorText,
  type RoleSectionData,
  type V2RoleEditor,
  type V2RoleTransaction,
} from '@/hooks/records/useV2Roles'
import { type RoleKind, readRoleAccess, RESOLVER_ROLE_DEFINITIONS } from '@/utils/records/v2Roles'
import { resolverRoleAccess } from '@/utils/records/resolverData'
import { createV2RecordsClient } from '@/utils/records/client'
import { recordPermission, validateRecordField } from '@/utils/records/v2Records'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { useDebounce } from '@/hooks/useDebounce'
import { accountQueryKey } from '@/utils/queryKeys'
import InputWithResolution from '../components/inputWithResolution'
import { RoleSection, type EditorRoleAssignment } from './rolesPanel'

export const AddRoleAccount = ({
  kind,
  section,
  viewer,
  onAdd,
  disabled,
  showNameImage = false,
}: {
  kind: RoleKind
  section: RoleSectionData
  viewer?: Address
  onAdd: (assignment: EditorRoleAssignment) => void
  disabled: boolean
  showNameImage?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const [account, setAccount] = useState('')
  const [scope, setScope] = useState('root')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const input = account.trim()
  const debouncedInput = useDebounce(input, 350)
  const isAddressInput = isAddress(input, { strict: false })
  const accountQuery = useQuery({
    queryKey: accountQueryKey(debouncedInput),
    queryFn: () => fetchAccount(debouncedInput),
    enabled: open && debouncedInput.includes('.') && !isAddress(debouncedInput, { strict: false }),
    retry: false,
    refetchOnWindowFocus: false,
  })
  // Never use a previous name's resolution while the input is changing.
  const resolvedAddress = isAddressInput
    ? input
    : input === debouncedInput
      ? (accountQuery.data?.address ?? null)
      : null
  const isResolving =
    open && !isAddressInput && input.includes('.') && (input !== debouncedInput || accountQuery.isFetching)
  const targetAddress =
    resolvedAddress && isAddress(resolvedAddress, { strict: false }) && resolvedAddress.toLowerCase() !== zeroAddress
      ? resolvedAddress
      : null
  const accountError =
    input && !isResolving && !targetAddress
      ? 'Enter a valid address or an ENS name that resolves to a non-zero address.'
      : null
  const client = useMemo(createV2RecordsClient, [])
  const snapshot = section.snapshot.data
  const definition = RESOLVER_ROLE_DEFINITIONS.find((role) => role.id === scope)
  const add = async () => {
    if (!snapshot || loading || disabled || isResolving) return
    setLoading(true)
    setError(null)
    try {
      if (!targetAddress) throw new Error('Enter a valid address or an ENS name that resolves to a non-zero address.')
      let resource = snapshot.resource
      let argument: Hex | undefined
      if (kind === 'resolver' && definition?.field) {
        const field = validateRecordField({ kind: definition.field, key })
        resource = recordPermission(field).resource
        argument =
          field.kind === 'text' || field.kind === 'data'
            ? stringToHex(field.key)
            : field.kind === 'interface'
              ? (field.key as Hex)
              : encodeAbiParameters([{ type: 'uint256' }], [BigInt(field.key)])
      }
      const target = targetAddress as Address
      let { roles: bitmap } = snapshot.permissions
        ? resolverRoleAccess(snapshot.permissions, resource, target)
        : await readRoleAccess(client, snapshot.contract, resource, target)
      if (kind === 'name' && snapshot.owner && target.toLowerCase() !== snapshot.owner.toLowerCase()) {
        const operator = await client.readContract({
          address: snapshot.contract,
          abi: REGISTRY_V2_ABI,
          functionName: 'isApprovedForAll',
          args: [snapshot.owner, target],
        })
        if (operator) {
          if (!section.history.data)
            throw new Error('Load the account history before editing an approved operator’s direct permissions.')
          bitmap =
            section.history.data.find(
              (row) => row.resource === resource && row.account.toLowerCase() === target.toLowerCase()
            )?.bitmap ?? BigInt(0)
        }
      }
      onAdd({ account: target, resource, bitmap, argument, roleId: definition?.id })
      setAccount('')
      setKey('')
      setOpen(false)
    } catch (error) {
      setError(roleErrorText(error))
    } finally {
      setLoading(false)
    }
  }
  if (!viewer) return null
  if (!open)
    return (
      <SecondaryButton disabled={disabled} className='w-full' onClick={() => setOpen(true)}>
        Add account
      </SecondaryButton>
    )
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col'>
        <Input
          label='Account'
          value={account}
          onChange={(event) => {
            setAccount(event.target.value)
            setError(null)
          }}
          placeholder='0x... or name.eth'
          disabled={disabled || loading}
          autoComplete='off'
          spellCheck={false}
        />
        <InputWithResolution
          value={input}
          resolvedAddress={targetAddress}
          isResolving={isResolving}
          showNameImage={showNameImage}
        />
      </div>
      {kind === 'resolver' && (
        <Dropdown
          label='Scope'
          value={scope}
          disabled={disabled || loading}
          options={[
            { value: 'root', label: 'All records' },
            ...RESOLVER_ROLE_DEFINITIONS.filter((role) => role.argument).map((role) => ({
              value: role.id,
              label: role.argument!,
            })),
          ]}
          onSelect={(value) => {
            setScope(String(value))
            setKey('')
          }}
        />
      )}
      {definition?.argument && (
        <Input
          label={definition.argument}
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder={
            definition.field === 'text'
              ? 'avatar'
              : definition.field === 'address'
                ? '60'
                : definition.field === 'abi'
                  ? '1'
                  : definition.field === 'interface'
                    ? '0x12345678'
                    : 'key'
          }
          disabled={disabled || loading}
        />
      )}
      {(error || accountError) && (
        <p role='alert' className='text-lg text-red-400'>
          {error || accountError}
        </p>
      )}
      <div className='flex gap-2'>
        <SecondaryButton
          className='w-full'
          disabled={disabled || loading || isResolving || !targetAddress}
          onClick={add}
        >
          {loading ? 'Loading…' : 'Add account'}
        </SecondaryButton>
        <SecondaryButton className='w-full' disabled={disabled || loading} onClick={() => setOpen(false)}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  )
}

const RolesEditor = ({ editor, transaction }: { editor: V2RoleEditor; transaction: V2RoleTransaction }) => {
  const { data } = editor
  const disabled = transaction.busy || !!transaction.pending
  if (data.binding.isPending) return <p className='text-neutral py-6 text-center text-lg'>Loading permissions…</p>
  if (data.binding.isError)
    return (
      <div className='flex flex-col gap-3'>
        <p role='alert' className='text-lg text-red-400'>
          {roleErrorText(data.binding.error)}
        </p>
        <SecondaryButton onClick={() => data.binding.refetch()}>Retry</SecondaryButton>
      </div>
    )
  return (
    <div className='flex flex-col gap-6'>
      {(['name', 'resolver'] as const).map((kind) => {
        const snapshot = (kind === 'name' ? data.nameRoles : data.resolverRoles).snapshot.data
        const key = `${data.address}:${kind}:${snapshot?.contract}:${snapshot?.resource}`
        return (
          <RoleSection
            key={kind}
            kind={kind}
            data={data}
            editor={kind === 'name' ? editor : undefined}
            extraAssignments={kind === 'name' ? editor.accounts[key] : undefined}
            disabled={disabled}
            collapsible
          >
            {kind === 'name' ? (
              <AddRoleAccount
                key={key}
                kind={kind}
                section={data.nameRoles}
                viewer={data.address}
                disabled={disabled}
                onAdd={(assignment) => editor.addAccount(key, assignment)}
              />
            ) : (
              <div className='bg-secondary border-tertiary p-md rounded-md border'>
                <p className='text-neutral text-lg'>Resolver permissions are read-only in this modal.</p>
              </div>
            )}
          </RoleSection>
        )
      })}
      {editor.changes.some((change) => change.admin && change.action === 'revoke') && (
        <p className='text-grace text-lg'>
          Removing Admin permissions can remove control permanently. Name admin permissions cannot be restored after
          registration.
        </p>
      )}
      {editor.walletChanged && (
        <p role='alert' className='text-lg text-red-400'>
          Reconnect the wallet that started these edits, or reset your changes.
        </p>
      )}
      {editor.hasChanges && (
        <button
          type='button'
          className='text-neutral hover:text-foreground cursor-pointer self-start text-lg underline'
          disabled={disabled}
          onClick={editor.reset}
        >
          Reset role changes
        </button>
      )}
      {transaction.step === 'success' && !editor.hasChanges && <p className='text-lg'>Permission changes saved.</p>}
      {transaction.error && (
        <p role='alert' className='text-lg text-red-400'>
          {transaction.error} Unsaved edits remain queued. Any confirmed changes have already been saved.
        </p>
      )}
      {transaction.pending && !transaction.busy && (
        <p className='text-neutral text-lg'>A transaction was submitted. Check its confirmation before continuing.</p>
      )}
      {transaction.explorerUrl && (
        <a className='text-primary text-lg underline' href={transaction.explorerUrl} target='_blank' rel='noreferrer'>
          View transaction
        </a>
      )}
    </div>
  )
}

export default RolesEditor
