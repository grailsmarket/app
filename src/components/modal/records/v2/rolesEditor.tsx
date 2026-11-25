'use client'

import { PermissionsSkeleton } from '@/components/ui/ensSkeletons'

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
import {
  readRoleAccess,
  RESOLVER_ROLE_DEFINITIONS,
  type RoleChange,
  type RoleAssignment,
} from '@/utils/records/v2Roles'
import { resolverRoleAccess } from '@/utils/records/resolverData'
import { createV2RecordsClient } from '@/utils/records/client'
import { recordPermission, validateRecordField } from '@/utils/records/v2Records'
import { useDebounce } from '@/hooks/useDebounce'
import { accountQueryKey } from '@/utils/queryKeys'
import InputWithResolution from '../components/inputWithResolution'
import { RoleSection, type EditorRoleAssignment } from './rolesPanel'

export const AddRoleAccount = ({
  section,
  viewer,
  onAdd,
  disabled,
  showNameImage = false,
}: {
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

      if (definition?.field) {
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
      const bitmap = section.undeployed
        ? (snapshot.initialAssignments.find(
            (row) => row.resource === resource && row.account.toLowerCase() === target.toLowerCase()
          )?.bitmap ?? BigInt(0))
        : snapshot.permissions
          ? resolverRoleAccess(snapshot.permissions, resource, target).roles
          : (await readRoleAccess(client, snapshot.contract, resource, target)).roles

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
        Add Manager
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
      <Dropdown
        label='Scope'
        value={scope}
        dropdownPosition='top'
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
      {loading && <PermissionsSkeleton label='Loading manager…' accounts={1} />}
      <div className='flex gap-2'>
        <SecondaryButton
          className='w-full'
          disabled={disabled || loading || isResolving || !targetAddress}
          onClick={add}
        >
          {loading ? 'Loading…' : 'Add Manager'}
        </SecondaryButton>
        <SecondaryButton className='w-full' disabled={disabled || loading} onClick={() => setOpen(false)}>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  )
}

const RolesEditor = ({
  editor,
  transaction,
  loadingManagers,
  onMove,
}: {
  editor: V2RoleEditor
  transaction: V2RoleTransaction
  loadingManagers: boolean
  onMove?: (change: RoleChange, assignment: RoleAssignment, next: boolean) => void
}) => {
  const { data } = editor
  const disabled = transaction.busy || !!transaction.pending

  if (data.binding.isError)
    return (
      <div className='flex flex-col gap-3'>
        <p role='alert' className='text-lg text-red-400'>
          {roleErrorText(data.binding.error)}
        </p>
        <SecondaryButton onClick={() => data.binding.refetch()}>Retry</SecondaryButton>
      </div>
    )

  const key = `${data.address}:${data.resolverRoles.snapshot.data?.contract.toLowerCase()}`
  return (
    <div className='flex flex-col gap-6'>
      <RoleSection kind='name' data={data} collapsible />
      <RoleSection
        kind='resolver'
        data={data}
        loading={loadingManagers}
        editor={data.canManage ? editor : undefined}
        onMove={onMove}
        extraAssignments={editor.accounts[key]}
        disabled={disabled}
        collapsible
      >
        <AddRoleAccount
          key={key}
          section={data.resolverRoles}
          viewer={data.canManage ? data.address : undefined}
          disabled={disabled}
          onAdd={(assignment) => editor.addAccount(key, assignment)}
        />
      </RoleSection>
      {editor.changes.some((change) => change.admin && change.action === 'revoke') && (
        <p className='text-grace text-lg'>
          Removing the last Admin for a permission can permanently prevent further changes to that permission.
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
          className='text-neutral hover:text-foreground mx-auto cursor-pointer self-start text-lg underline'
          disabled={disabled}
          onClick={editor.reset}
        >
          Reset role changes
        </button>
      )}
      {/* Success and errors have their own screens in the editor ("Permissions Saved", "Permissions Partly Saved"). */}
      {transaction.pending && !transaction.busy && (
        <p className='text-neutral text-lg'>A transaction was submitted. Check its confirmation before continuing.</p>
      )}
    </div>
  )
}

export default RolesEditor
