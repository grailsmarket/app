'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchNameVersion } from '@/api/name/details'
import { readNameResolver } from '@/utils/records/v2Resolver'
import { createV2RecordsClient } from '@/utils/records/client'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import SecondaryButton from '@/components/ui/buttons/secondary'
import MigrationModal from '@/components/modal/migration/migrationModal'
import V1EditRecordsModal from './v1/editRecordsModal'
import V2EditRecordsModal from './v2/editRecordsModal'

interface EditRecordsModalProps {
  name: string
  version: number | null
  metadata: Record<string, string> | null
  defaultTab: 'records' | 'roles'
  onClose: () => void
}

const EditRecordsModal = ({ name, version, metadata, defaultTab, onClose }: EditRecordsModalProps) => {
  const [migratedName, setMigratedName] = useState<string>()
  const [migrationName, setMigrationName] = useState<string>()
  const lookup = useQuery({
    queryKey: ['name', 'recordEditorVersion', activeChain.id, config.ensV2Registry, name],
    queryFn: async () => {
      try {
        return await fetchNameVersion(name)
      } catch {
        const binding = await readNameResolver(createV2RecordsClient(), name, config.ensV2Registry)
        if (binding.registered) return 2
        throw new Error('Could not verify this name’s ENS version.')
      }
    },
    enabled: version == null,
    retry: false,
  })
  const resolvedVersion = migratedName === name || lookup.data === 2 ? 2 : (version ?? lookup.data)

  // Keep the migration mounted while its final record-copy transaction completes, even if the version cache updates.
  if (migrationName === name) {
    return (
      <MigrationModal
        key={name}
        name={name}
        onBack={() => setMigrationName(undefined)}
        onComplete={() => {
          setMigratedName(name)
          setMigrationName(undefined)
        }}
        onClose={onClose}
      />
    )
  }

  if (resolvedVersion === 1) {
    return (
      <V1EditRecordsModal
        key={name}
        name={name}
        metadata={metadata}
        defaultTab={defaultTab}
        onClose={onClose}
        onMigrate={() => setMigrationName(name)}
      />
    )
  }

  if (resolvedVersion === 2) {
    return <V2EditRecordsModal key={name} name={name} defaultTab={defaultTab} onClose={onClose} />
  }

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label='Edit records'
      className='fixed inset-0 z-100 flex h-dvh items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-4'
      onClick={onClose}
    >
      <div
        className='bg-background border-tertiary flex h-[calc(100dvh-56px)] w-full flex-col overflow-hidden rounded-md border-t shadow-lg md:max-h-[90dvh] md:max-w-xl md:border-2'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='border-tertiary shrink-0 border-b px-4 py-3 sm:px-6'>
          <h2 className='text-xl font-bold'>Edit {name}</h2>
        </div>
        <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:px-6'>
          <p className='text-neutral py-6 text-center'>
            {version == null && lookup.isPending
              ? 'Checking this name’s ENS version…'
              : 'Could not verify this name’s ENS version. Reload before editing its records.'}
          </p>
        </div>
        <div className='border-tertiary flex shrink-0 flex-col gap-2 border-t p-4 sm:px-6'>
          {lookup.isError && <SecondaryButton onClick={() => lookup.refetch()}>Retry</SecondaryButton>}
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default EditRecordsModal
