'use client'

import { type Address, hexToString, zeroAddress } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { Avatar, fetchAccount, ShortArrow } from 'ethereum-identity-kit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import CopyButton from '@/components/ui/copyButton'
import {
  roleErrorText,
  useV2RoleAuthority,
  type RoleDraftEditor,
  type RoleSectionData,
  type V2RolesData,
} from '@/hooks/records/useV2Roles'
import {
  adminRole,
  hasRole,
  roleDefinitions,
  roleScopeLabel,
  type RoleAssignment,
  type RoleChange,
  type RoleDefinition,
  type RoleKind,
} from '@/utils/records/v2Roles'
import { activeChain } from '@/constants/web3/chain'
import { cn } from '@/utils/tailwind'
import { accountQueryKey } from '@/utils/queryKeys'
import { beautifyName } from '@/lib/ens'

export type EditorRoleAssignment = RoleAssignment & { roleId?: string; roleIds?: string[] }

const Account = ({ address, resolvePrimaryName = false }: { address: Address; resolvePrimaryName?: boolean }) => {
  const { data: account } = useQuery({
    queryKey: accountQueryKey(address),
    queryFn: () => fetchAccount(address),
    enabled: resolvePrimaryName,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const primaryName = resolvePrimaryName && account?.ens?.name ? beautifyName(account.ens.name) : null

  return (
    <div className='flex min-w-0 items-center gap-2'>
      {primaryName && (
        <Avatar
          address={address}
          name={account?.ens?.name}
          src={account?.ens?.avatar}
          style={{ height: '26px', width: '26px', minWidth: '26px' }}
        />
      )}
      <a
        className='hover:text-primary truncate text-lg font-semibold transition-colors'
        href={`${activeChain.blockExplorers.default.url}/address/${address}`}
        target='_blank'
        rel='noreferrer'
        title={primaryName ? `${primaryName} (${address})` : address}
      >
        {primaryName || `${address.slice(0, 6)}…${address.slice(-4)}`}
      </a>
      <CopyButton value={address} />
    </div>
  )
}

const PermissionCheckbox = ({
  change,
  initial,
  editor,
  disabled,
}: {
  change: RoleChange
  initial: boolean
  editor: RoleDraftEditor
  disabled: boolean
}) => {
  const baseline = editor.initial(change, initial)
  const authority = useV2RoleAuthority({ ...change, action: baseline ? 'revoke' : 'grant' })
  const checked = editor.checked(change, initial)
  const changed = checked !== baseline
  return (
    <input
      type='checkbox'
      aria-label={`${change.roleId} ${change.admin ? 'Admin' : 'User'} for ${change.account}`}
      checked={checked}
      disabled={disabled || editor.walletChanged || (!changed && !authority.allowed)}
      title={
        changed
          ? 'Unsaved change'
          : authority.validationError ||
            authority.error ||
            (!authority.allowed ? 'Requires the corresponding Admin permission' : undefined)
      }
      className={cn(
        'accent-primary h-5 w-5 cursor-pointer rounded-sm disabled:cursor-not-allowed disabled:opacity-40',
        changed && 'ring-primary ring-offset-background ring-1 ring-offset-2'
      )}
      onChange={(event) => editor.toggle(change, baseline, event.target.checked)}
    />
  )
}

interface RoleSectionProps {
  kind: RoleKind
  data?: V2RolesData
  resolverSection?: RoleSectionData
  editor?: RoleDraftEditor
  extraAssignments?: EditorRoleAssignment[]
  disabled?: boolean
  collapsible?: boolean
  showHeader?: boolean
  children?: React.ReactNode
}

export const RoleSection: React.FC<RoleSectionProps> = ({
  kind,
  data,
  resolverSection,
  editor,
  extraAssignments = [],
  disabled = false,
  collapsible = false,
  showHeader = true,
  children,
}) => {
  const section = resolverSection ?? (kind === 'name' ? data!.nameRoles : data!.resolverRoles)
  const snapshot = section.snapshot.data
  const definitions = roleDefinitions(kind)
  const assignments = new Map<string, EditorRoleAssignment>()

  for (const assignment of section.assignments)
    assignments.set(`${assignment.resource}:${assignment.account.toLowerCase()}`, assignment)

  for (const assignment of extraAssignments) {
    const key = `${assignment.resource}:${assignment.account.toLowerCase()}`
    const existing = assignments.get(key)
    assignments.set(key, {
      ...assignment,
      ...existing,
      roleIds: [...new Set([...(existing?.roleIds ?? []), ...(assignment.roleId ? [assignment.roleId] : [])])],
    })
  }

  const visible = [...assignments.values()].filter(
    (assignment) =>
      (!!editor && !(kind === 'name' && assignment.resource === BigInt(0))) ||
      definitions.some(
        (role) => hasRole(assignment.bitmap, role.bit) || hasRole(assignment.bitmap, adminRole(role.bit))
      )
  )
  const inherited = visible.filter((assignment) => assignment.resource === BigInt(0))

  const createChange = (
    role: RoleDefinition,
    assignment: RoleAssignment,
    admin: boolean,
    initial: boolean
  ): RoleChange => {
    let key = ''
    if (assignment.argument) {
      try {
        key =
          role.field === 'text' || role.field === 'data'
            ? hexToString(assignment.argument)
            : role.field === 'interface'
              ? assignment.argument
              : BigInt(assignment.argument).toString()
      } catch {
        /* Unknown resources can still be revoked. */
      }
    }

    return {
      kind,
      contract: snapshot!.contract,
      nameResource: kind === 'name' ? data!.binding.data!.resource : BigInt(0),
      account: assignment.account,
      roleId: role.id,
      admin,
      scoped: kind === 'resolver' && assignment.resource !== BigInt(0),
      key,
      action: initial ? 'revoke' : 'grant',
      revokeResource: kind === 'resolver' && assignment.resource !== BigInt(0) ? assignment.resource : undefined,
    }
  }

  const permission = (assignment: RoleAssignment, role: RoleDefinition, admin: boolean) => {
    if (role.adminOnly && !admin) return <span className='text-neutral'>—</span>

    const initial = hasRole(assignment.bitmap, admin ? adminRole(role.bit) : role.bit)

    if (editor && !(kind === 'name' && assignment.resource === BigInt(0))) {
      const change = createChange(role, assignment, admin, initial)
      return <PermissionCheckbox change={change} initial={initial} editor={editor} disabled={disabled} />
    }

    return (
      <input
        type='checkbox'
        checked={initial}
        disabled
        aria-label={`${role.label} ${admin ? 'Admin' : 'User'} for ${assignment.account}`}
        className='accent-primary h-5 w-5 rounded-sm disabled:opacity-40'
      />
    )
  }

  const assignmentRows = (assignment: EditorRoleAssignment) => {
    const roles = definitions.filter(
      (role) =>
        (editor &&
          !(kind === 'name' && assignment.resource === BigInt(0)) &&
          (kind === 'name' || assignment.resource === BigInt(0) || assignment.roleIds?.includes(role.id))) ||
        hasRole(assignment.bitmap, role.bit) ||
        hasRole(assignment.bitmap, adminRole(role.bit))
    )

    return roles.map((role) => (
      <tr className='border-tertiary border-t' key={`${assignment.resource}:${role.id}`}>
        <td className='px-4 py-3 font-medium'>
          {role.label}
          {kind === 'resolver' && assignment.resource !== BigInt(0) && (
            <p className='text-neutral mt-1 text-lg wrap-break-word'>{roleScopeLabel(assignment, role, kind)}</p>
          )}
        </td>
        <td className='text-center align-middle'>{permission(assignment, role, true)}</td>
        <td className='text-center align-middle'>{permission(assignment, role, false)}</td>
      </tr>
    ))
  }

  const accountCards = (items: EditorRoleAssignment[]) => {
    const accounts = new Map<string, EditorRoleAssignment[]>()
    for (const assignment of items) {
      const key = `${assignment.account.toLowerCase()}${collapsible ? '' : `:${assignment.resource}`}`
      accounts.set(key, [...(accounts.get(key) ?? []), assignment])
    }

    return [...accounts.entries()].map(([key, accountAssignments]) => {
      const assignment = accountAssignments[0]
      const header = (
        <>
          <Account address={assignment.account} resolvePrimaryName />
          <span className='text-neutral flex items-center gap-2 text-lg'>
            {kind === 'name' ? (assignment.resource === BigInt(0) ? 'Inherited' : 'This name') : 'All configurations'}
            {collapsible && (
              <ShortArrow className='h-3.5 w-3.5 shrink-0 rotate-180 transition-transform group-open/account:rotate-0' />
            )}
          </span>
        </>
      )

      const table = (
        <table className='w-full table-fixed text-left text-lg'>
          <thead className='text-neutral'>
            <tr>
              <th className='px-4 py-3 font-medium'>Permission</th>
              <th className='w-16 py-3 text-center font-medium'>Admin</th>
              <th className='w-16 py-3 text-center font-medium'>User</th>
            </tr>
          </thead>
          <tbody>{accountAssignments.flatMap(assignmentRows)}</tbody>
        </table>
      )

      return collapsible ? (
        <details
          key={key}
          className='group/account border-tertiary overflow-hidden rounded-md border'
          open={kind === 'name'}
        >
          <summary className='bg-secondary border-tertiary flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 group-open/account:border-b [&::-webkit-details-marker]:hidden'>
            {header}
          </summary>
          {table}
        </details>
      ) : (
        <div key={key} className='border-tertiary overflow-hidden rounded-md border'>
          <div className='bg-secondary border-tertiary flex min-h-12 items-center justify-between gap-2 border-b px-4 py-3'>
            {header}
          </div>
          {table}
        </div>
      )
    })
  }

  return (
    <section
      className='flex min-w-0 flex-col gap-3'
      aria-label={kind === 'name' ? 'Name permissions' : 'Resolver permissions'}
    >
      {showHeader && (
        <div className='flex flex-col gap-2'>
          <h3 className='text-xl font-bold'>{kind === 'name' ? 'Name permissions' : 'Resolver permissions'}</h3>
          <p className='text-neutral text-lg'>
            {kind === 'name'
              ? 'Manage who can update this name. Admin permissions control access; User permissions allow the action.'
              : 'These permissions apply to every configuration and name using this resolver.'}
          </p>
        </div>
      )}
      {kind === 'name' && !data?.binding.data?.registered ? (
        <p className='text-neutral text-lg'>This name has no active V2 registration.</p>
      ) : kind === 'resolver' && data?.binding.data?.resolver === zeroAddress ? (
        <p className='text-neutral text-lg'>No resolver is assigned.</p>
      ) : section.snapshot.isPending ? (
        <p className='text-neutral text-lg'>Loading permissions…</p>
      ) : section.snapshot.isError ? (
        <div className='flex flex-col gap-3'>
          <p role='alert' className='text-lg text-red-400'>
            {roleErrorText(section.snapshot.error)}
          </p>
          <SecondaryButton onClick={() => section.snapshot.refetch()}>Retry</SecondaryButton>
        </div>
      ) : (
        snapshot && (
          <>
            {showHeader && (
              <div className='text-neutral flex items-center gap-2 text-lg'>
                <span>{kind === 'name' ? 'Registry' : 'Resolver'}</span>
                <Account address={snapshot.contract} />
              </div>
            )}
            {accountCards(visible.filter((assignment) => kind !== 'name' || assignment.resource !== BigInt(0)))}
            {kind === 'name' && inherited.length > 0 && (
              <details className='text-lg' open={false}>
                <summary className='text-neutral cursor-pointer py-1'>
                  Inherited registry permissions ({inherited.length})
                </summary>
                <div className='mt-3 flex flex-col gap-3'>{accountCards(inherited)}</div>
              </details>
            )}
            {children}
            {section.history.isError ? (
              <div className='flex flex-col gap-2'>
                <p className='text-neutral text-lg'>
                  Some accounts could not be loaded. Known permissions remain available.
                </p>
                <SecondaryButton onClick={() => section.history.refetch()} disabled={section.history.isFetching}>
                  Retry account discovery
                </SecondaryButton>
              </div>
            ) : !section.history.data ? (
              <p className='text-neutral text-lg'>Loading other accounts…</p>
            ) : (
              visible.length === 0 && <p className='text-neutral text-lg'>No assigned permissions.</p>
            )}
          </>
        )
      )}
    </section>
  )
}

const RolesPanel = ({ data }: { data: V2RolesData }) => {
  if (data.binding.isPending) return <p className='text-neutral text-lg'>Loading permissions…</p>

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
      <RoleSection kind='name' data={data} />
      <RoleSection kind='resolver' data={data} />
    </div>
  )
}

export default RolesPanel
