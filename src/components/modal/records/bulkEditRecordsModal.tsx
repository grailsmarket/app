'use client'

import { useCallback, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { fetchNameVersion } from '@/api/name/details'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { createV2RecordsClient } from '@/utils/records/client'
import { readNameResolver } from '@/utils/records/v2Resolver'
import type { BulkRecordName } from '@/types/records'
import ModalShell from '@/components/ui/modal/modalShell'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { NameListSkeleton } from '@/components/ui/ensSkeletons'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import V1BulkEditRecordsModal from './v1/bulkEditRecordsModal'
import V2BulkEditRecordsModal from './v2/bulkEditRecordsModal'
import PrimaryButton from '@/components/ui/buttons/primary'
import { useAppDispatch } from '@/state/hooks'
import { Check } from 'ethereum-identity-kit'
import { setBulkEditRecordsModalNames } from '@/state/reducers/modals/bulkEditRecordsModal'

interface BulkEditRecordsModalProps {
  names: BulkRecordName[]
  onClose: () => void
}

const BulkEditRecordsModal = ({ names, onClose }: BulkEditRecordsModalProps) => {
  const [selectedVersion, setSelectedVersion] = useState<1 | 2>()
  const [editedNames, setEditedNames] = useState<string[]>([])

  const versions = useQueries({
    queries: names.map(({ name, version }) => ({
      queryKey: ['name', 'recordEditorVersion', activeChain.id, config.ensV2Registry, name],
      enabled: version !== 1 && version !== 2,
      retry: false,
      queryFn: async () => {
        try {
          return await fetchNameVersion(name)
        } catch {
          const binding = await readNameResolver(createV2RecordsClient(), name, config.ensV2Registry)
          if (binding.registered) return 2
          throw new Error(`Could not verify the ENS version of ${name}.`)
        }
      },
    })),
  })

  const dispatch = useAppDispatch()
  const resolved = names.map((item, index) => ({
    ...item,
    version: item.version === 1 || item.version === 2 ? item.version : versions[index].data,
  }))
  const unknown = resolved.some(({ version }) => version !== 1 && version !== 2)
  const failed = versions.some((query, index) => !resolved[index].version && query.isError)
  const v1 = resolved.filter(({ version }) => version === 1).map(({ name }) => name)
  const v2 = resolved.filter(({ version }) => version === 2).map(({ name }) => name)
  const mixed = v1.length > 0 && v2.length > 0
  const version = mixed ? selectedVersion : v2.length ? 2 : 1

  const onModalClose = useCallback(() => {
    // if all names were edited, clear the bulk selection
    const allNamesEdited = names.every((name) => editedNames?.includes(name.name))
    if (allNamesEdited) dispatch(setBulkEditRecordsModalNames([]))

    onClose()
  }, [names, editedNames, onClose, dispatch, setBulkEditRecordsModalNames])

  const onEditorClose = useCallback(
    (txComplete?: boolean) => {
      if (mixed) {
        // Treat all names for selected versions as successfully edited
        // after editor was closed following a successful transaction
        if (txComplete) setEditedNames((prev) => prev?.concat(selectedVersion === 2 ? v2 : v1))
        setSelectedVersion(undefined)
      } else {
        onClose()
      }
    },
    [mixed, selectedVersion, onClose]
  )

  if (!unknown && version === 1) return <V1BulkEditRecordsModal names={v1} onClose={onEditorClose} />

  if (!unknown && version === 2)
    return (
      <SettingsTransactionProvider>
        <V2BulkEditRecordsModal key={v2.join(',')} names={v2} onClose={onEditorClose} />
      </SettingsTransactionProvider>
    )

  const successfullyEdited = (names: string[]) =>
    names.every((name) => editedNames?.includes(name)) && (
      <div className='absolute top-2.5 right-2 rounded-full bg-green-500 p-1'>
        <Check className='text-primary h-3.5 w-3.5' />
      </div>
    )

  return (
    <ModalShell title='Edit Records' onClose={onModalClose}>
      {unknown ? (
        failed ? (
          <>
            <p className='text-red-400' role='alert'>
              Could not verify every name’s ENS version. Retry before editing records.
            </p>
            <SecondaryButton onClick={() => versions.forEach((query) => query.isError && void query.refetch())}>
              Retry
            </SecondaryButton>
          </>
        ) : (
          <NameListSkeleton label='Checking ENS versions…' />
        )
      ) : (
        <>
          <p className='text-neutral px-md text-lg font-medium'>
            This selection includes ENS names from both versions. You have to edit each version records individually
          </p>
          <div className='flex items-center gap-2 pt-2'>
            <PrimaryButton className='w-1/2' onClick={() => setSelectedVersion(2)}>
              <p>V2 · {v2.length} names</p>
              {successfullyEdited(v2)}
            </PrimaryButton>
            <PrimaryButton className='w-1/2' onClick={() => setSelectedVersion(1)}>
              <p>V1 · {v1.length} names</p>
              {successfullyEdited(v1)}
            </PrimaryButton>
          </div>
          <SecondaryButton className='w-full' onClick={onModalClose}>
            Close
          </SecondaryButton>
        </>
      )}
    </ModalShell>
  )
}

export default BulkEditRecordsModal
