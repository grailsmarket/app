'use client'

import React, { useState } from 'react'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import { CopyValue } from './primaryDetails'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { useAppDispatch } from '@/state/hooks'
import {
  setEditRecordsModalOpen,
  setEditRecordsModalName,
  setEditRecordsModalMetadata,
  setEditRecordsModalDefaultTab,
} from '@/state/reducers/modals/editRecordsModal'
import PencilIcon from 'public/icons/pencil.svg'
import { useUserContext } from '@/context/user'
import { isAddress } from 'viem'
import { MetadataType, RolesType } from '@/types/api'

interface NameDetailsProps {
  name: string
  nameOwner?: string | null
  roles?: RolesType | null
  isRolesLoading: boolean
  metadata?: MetadataType[]
}

const Roles: React.FC<NameDetailsProps> = ({ name, nameOwner, metadata = [], roles, isRolesLoading }) => {
  const [isRolesOpen, setIsRolesOpen] = useState(true)
  const { userAddress, authStatus } = useUserContext()
  const isNameOwner = authStatus === 'authenticated' && nameOwner?.toLowerCase() === userAddress?.toLowerCase()
  const dispatch = useAppDispatch()

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div
        className='flex cursor-pointer flex-row items-center justify-between transition-opacity hover:opacity-80'
        onClick={() => setIsRolesOpen(!isRolesOpen)}
      >
        <div className='flex items-center gap-2'>
          <h3 className='font-sedan-sc text-3xl'>Roles</h3>
          {isNameOwner && (
            <button
              className='hover:bg-tertiary flex h-7 w-7 items-center justify-center rounded-md transition-colors'
              onClick={(e) => {
                e.stopPropagation()
                const metadataRecord = metadata.reduce(
                  (acc, row) => {
                    acc[row.label] = row.value
                    return acc
                  },
                  {} as Record<string, string>
                )

                dispatch(setEditRecordsModalName(name))
                dispatch(setEditRecordsModalMetadata(metadataRecord))
                dispatch(setEditRecordsModalOpen(true))
                dispatch(setEditRecordsModalDefaultTab('roles'))
              }}
            >
              <Image src={PencilIcon} alt='Edit records' width={16} height={16} className='invert' />
            </button>
          )}
        </div>
        <div className='flex flex-row items-center gap-2'>
          <ShortArrow
            className={cn('h-4 w-4 flex-shrink-0 transition-transform', isRolesOpen ? 'rotate-0' : 'rotate-180')}
          />
        </div>
      </div>
      {isRolesOpen &&
        (isRolesLoading ? (
          <div className='flex w-full items-center justify-center py-2'>
            <LoadingSpinner size='h-10 w-10' />
          </div>
        ) : roles ? (
          <div className='grid grid-cols-2 gap-4'>
            <div key='owner' className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
              <CopyValue value={roles.owner} canCopy={true} truncateValue={isAddress(roles.owner)} />
              <p className='text-neutral text-lg font-medium'>Owner</p>
            </div>
            <div key='manager' className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
              <CopyValue value={roles.manager} canCopy={true} truncateValue={isAddress(roles.manager)} />
              <p className='text-neutral text-lg font-medium'>Manager</p>
            </div>
          </div>
        ) : (
          <div className='text-neutral pb-2 text-center text-xl font-medium'>No records found</div>
        ))}
    </div>
  )
}

export default Roles
