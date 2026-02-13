'use client'

import React, { useState } from 'react'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'
import { CopyValue } from './primaryDetails'
import { useQuery } from '@tanstack/react-query'
import { fetchNameMetadata } from '@/api/name/metadata'
import Image from 'next/image'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import LoadingCell from '@/components/ui/loadingCell'
import { useAppDispatch } from '@/state/hooks'
import {
  setEditRecordsModalOpen,
  setEditRecordsModalName,
  setEditRecordsModalMetadata,
} from '@/state/reducers/modals/editRecordsModal'
import PencilIcon from 'public/icons/pencil.svg'
import { useUserContext } from '@/context/user'
import { isAddress } from 'viem'

interface NameDetailsProps {
  name: string
  nameOwner?: string | null
}

const Metadata: React.FC<NameDetailsProps> = ({ name, nameOwner }) => {
  const [isMetadataOpen, setIsMetadataOpen] = useState(true)
  const { userAddress, authStatus } = useUserContext()
  const isNameOwner = authStatus === 'authenticated' && nameOwner?.toLowerCase() === userAddress?.toLowerCase()
  const dispatch = useAppDispatch()
  const { data: fetchedMetadata, isLoading: isMetadataLoading } = useQuery({
    queryKey: ['name', 'metadata', name],
    queryFn: async () => {
      const details = await fetchNameMetadata(name)
      return details
    },
    enabled: !!name,
  })

  const metadata = Object.entries(fetchedMetadata || {})
    .flatMap(([key, value]) => {
      if (key === 'chains') {
        return value.map(({ chainName, address }: { chainName: string; address: string }) => ({
          label: chainName,
          value: address,
          canCopy: true,
        }))
      }

      return {
        label: key,
        value: value,
        canCopy: true,
      }
    })
    .filter((row) => row.label !== 'resolverAddress')

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div
        className='flex cursor-pointer flex-row items-center justify-between transition-opacity hover:opacity-80'
        onClick={() => setIsMetadataOpen(!isMetadataOpen)}
      >
        <div className='flex items-center gap-2'>
          <h3 className='font-sedan-sc text-3xl'>Records</h3>
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
              }}
            >
              <Image src={PencilIcon} alt='Edit records' width={16} height={16} className='invert' />
            </button>
          )}
        </div>
        <div className='flex flex-row items-center gap-2'>
          {isMetadataLoading ? (
            <LoadingCell height='20px' width='16px' />
          ) : (
            <p className='text-xl font-bold'>{metadata.length}</p>
          )}
          <ShortArrow
            className={cn('h-4 w-4 flex-shrink-0 transition-transform', isMetadataOpen ? 'rotate-0' : 'rotate-180')}
          />
        </div>
      </div>
      {isMetadataOpen &&
        (isMetadataLoading ? (
          <div className='flex w-full items-center justify-center py-2'>
            <LoadingSpinner size='h-10 w-10' />
          </div>
        ) : metadata.length > 0 ? (
          <div className='grid grid-cols-2 gap-4'>
            {metadata.find((row) => row.label.toLowerCase() === 'ethereum') && (
              <>
                <div key='ethereum' className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
                  <CopyValue
                    value={metadata.find((row) => row.label.toLowerCase() === 'ethereum')?.value as string}
                    canCopy={true}
                    truncateValue={true}
                  />
                  <p className='text-neutral text-lg font-medium'>ethereum</p>
                </div>
                <div />
              </>
            )}
            {metadata.find((row) => row.label === 'avatar') && (
              <div key='avatar' className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
                <Image
                  src={`https://metadata.ens.domains/mainnet/avatar/${name}`}
                  alt='Avatar'
                  width={40}
                  height={40}
                  className='rounded-md pb-1'
                  unoptimized={true}
                />
                <CopyValue value={metadata.find((row) => row.label === 'avatar')?.value as string} canCopy={true} />
                <p className='text-neutral text-lg font-medium'>avatar</p>
              </div>
            )}
            {metadata.find((row) => row.label === 'header') && (
              <div key='header' className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'>
                <Image
                  src={`https://metadata.ens.domains/mainnet/header/${name}`}
                  alt='Header'
                  width={120}
                  height={40}
                  className='h-10 w-fit rounded-md pb-1'
                  unoptimized={true}
                />
                <CopyValue value={metadata.find((row) => row.label === 'header')?.value as string} canCopy={true} />
                <p className='text-neutral text-lg font-medium'>header</p>
              </div>
            )}
            {metadata
              .filter(
                (row) => row.label !== 'avatar' && row.label !== 'header' && row.label.toLowerCase() !== 'ethereum'
              )
              .map((row) => {
                return (
                  <div
                    key={row.label}
                    className='bg-secondary border-neutral pl-md flex h-fit w-full flex-col border-l-2'
                  >
                    {row.canCopy && typeof row.value === 'string' ? (
                      <CopyValue value={row.value} canCopy={row.canCopy} truncateValue={isAddress(row.value)} />
                    ) : (
                      <div className='text-xl font-medium'>{row.value}</div>
                    )}
                    <p className='text-neutral text-lg font-medium'>{row.label}</p>
                  </div>
                )
              })}
          </div>
        ) : (
          <div className='text-neutral pb-2 text-center text-xl font-medium'>No records found</div>
        ))}
    </div>
  )
}

export default Metadata
