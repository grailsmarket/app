'use client'

import { useState } from 'react'
import { ShortArrow } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { useV2Roles } from '@/hooks/records/useV2Roles'
import { adminRole, hasRole, roleDefinitions } from '@/utils/records/v2Roles'
import RolesPanel from '@/components/modal/records/v2/rolesPanel'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useAppDispatch } from '@/state/hooks'
import {
  setEditRecordsModalOpen,
  setEditRecordsModalName,
  setEditRecordsModalVersion,
  setEditRecordsModalDefaultTab,
} from '@/state/reducers/modals/editRecordsModal'

const V2Roles = ({ name }: { name: string }) => {
  const [open, setOpen] = useState(false)
  const data = useV2Roles(name, open)
  const dispatch = useAppDispatch()
  const viewer = data.address?.toLowerCase()
  const canManagePermissions =
    !!viewer &&
    data.binding.isSuccess &&
    [data.nameRoles, data.resolverRoles].some(({ snapshot, assignments }) => {
      if (!snapshot.isSuccess) return false
      if (snapshot.data.kind === 'name') {
        if (!data.binding.data?.registered) return false
        if (snapshot.data.owner?.toLowerCase() === viewer) return true
      }

      // Include scoped resolver admins as well as effective name and resolver-wide permissions.
      const viewerRoles = assignments
        .filter((assignment) => assignment.account.toLowerCase() === viewer)
        .reduce((bitmap, assignment) => bitmap | assignment.bitmap, snapshot.data.viewerRoles)

      return roleDefinitions(snapshot.data.kind).some((role) => hasRole(viewerRoles, adminRole(role.bit)))
    })

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
      <button
        type='button'
        aria-expanded={open}
        className='flex cursor-pointer flex-row items-center justify-between transition-opacity hover:opacity-80'
        onClick={() => setOpen(!open)}
      >
        <h3 className='font-sedan-sc text-3xl'>Roles</h3>
        <div className='flex items-center gap-2'>
          <p className='font-semibold'>{data.nameRoles.assignments.length}</p>
          <ShortArrow className={cn('h-4 w-4 shrink-0 transition-transform', open ? 'rotate-0' : 'rotate-180')} />
        </div>
      </button>
      {open && (
        <>
          <RolesPanel data={data} />
          {canManagePermissions && (
            <SecondaryButton
              className='w-full'
              onClick={() => {
                dispatch(setEditRecordsModalName(name))
                dispatch(setEditRecordsModalVersion(2))
                dispatch(setEditRecordsModalDefaultTab('roles'))
                dispatch(setEditRecordsModalOpen(true))
              }}
            >
              Manage permissions
            </SecondaryButton>
          )}
        </>
      )}
    </div>
  )
}

export default V2Roles
