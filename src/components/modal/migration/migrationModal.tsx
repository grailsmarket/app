'use client'

import { useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { sepolia } from 'viem/chains'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check } from 'ethereum-identity-kit'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useEnsV2 } from '@/hooks/useEnsV2'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { beautifyName } from '@/lib/ens'
import { NFT_ABI } from '@/constants/abi/NFTAbi'
import { MIGRATION_HELPER_ABI } from '@/constants/abi/ENSv2'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForSuccess } from '@/utils/web3/safeTransaction'
import {
  type MigrationCandidate,
  type MigrationIssue,
  checkMigration,
  migrationApprovals,
  migrationBatches,
} from '@/utils/web3/ensMigration'

interface MigrationModalProps {
  names: string[]
  onClose: () => void
}

type MigrationStep = 'review' | 'processing' | 'success' | 'error'

const MigrationModal: React.FC<MigrationModalProps> = ({ names, onClose }) => {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: sepolia.id })
  const getWalletClient = useGetWalletClient()
  const queryClient = useQueryClient()
  const ensV2 = useEnsV2()
  const [step, setStep] = useState<MigrationStep>('review')
  const [error, setError] = useState<string | null>(null)

  const {
    data: results,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['migration', address, names],
    queryFn: () => checkMigration(publicClient!, ensV2!, address!, names),
    enabled: !!publicClient && !!ensV2 && !!address,
  })
  const candidates = (results ?? []).filter((result): result is MigrationCandidate => 'kind' in result)
  const issues = (results ?? []).filter((result): result is MigrationIssue => 'issue' in result)

  const handleUpgrade = async () => {
    if (!publicClient || !ensV2 || !address) return
    setStep('processing')
    setError(null)

    try {
      const walletClient = await getWalletClient()
      await ensureChain(walletClient, sepolia.id)

      for (const contract of await migrationApprovals(publicClient, ensV2, address, candidates)) {
        const hash = await walletClient.writeContract({
          address: contract,
          abi: NFT_ABI,
          functionName: 'setApprovalForAll',
          args: [ensV2.migrationHelper, true],
          chain: sepolia,
        })
        await waitForSuccess(publicClient, hash)
      }

      for (const args of migrationBatches(candidates)) {
        const hash = await walletClient.writeContract({
          address: ensV2.migrationHelper,
          abi: MIGRATION_HELPER_ABI,
          functionName: 'migrate',
          args,
          chain: sepolia,
        })
        await waitForSuccess(publicClient, hash)
      }

      names.forEach((name) => queryClient.refetchQueries({ queryKey: ['name', 'details', name] }))
      queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upgrade failed')
      setStep('error')
    }
  }

  const renderContent = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <p className='text-neutral text-md bg-secondary border-tertiary rounded-md border p-3'>
              Upgrading moves your names to ENSv2. Your records keep resolving; editing them later moves them to your
              own ENSv2 resolver. Active listings and offers for these names stop working, so relist after upgrading.
            </p>
            {isLoading ? (
              <div className='border-primary mx-auto my-2 inline-block h-10 w-10 animate-spin rounded-full border-b-2' />
            ) : (
              candidates.length > 0 && (
                <div className='bg-secondary max-h-48 overflow-y-auto rounded-md p-4'>
                  {candidates.map(({ name }) => (
                    <div key={name} className='py-1 font-bold'>
                      {beautifyName(name)}
                    </div>
                  ))}
                </div>
              )
            )}
            {isError && <p className='text-md text-red-400'>Could not check these names. Please try again.</p>}
            {issues.length > 0 && (
              <div className='rounded-lg border border-amber-500/20 bg-amber-900/20 p-3'>
                {issues.map(({ name, issue }) => (
                  <p key={name} className='text-md text-amber-400'>
                    {beautifyName(name)}: {issue}
                  </p>
                ))}
              </div>
            )}
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton onClick={handleUpgrade} disabled={isLoading || candidates.length === 0} className='w-full'>
                {`Upgrade ${candidates.length} Name${candidates.length === 1 ? '' : 's'}`}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )

      case 'processing':
        return (
          <div className='flex flex-col items-center gap-4'>
            <div className='border-primary my-2 inline-block h-12 w-12 animate-spin rounded-full border-b-2' />
            <p className='text-lg'>Please confirm the transactions in your wallet...</p>
          </div>
        )

      case 'success':
        return (
          <>
            <div className='flex flex-col items-center gap-4'>
              <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <p className='text-center text-lg font-medium'>
                Upgraded {candidates.length} name{candidates.length === 1 ? '' : 's'} to ENSv2!
              </p>
            </div>
            <SecondaryButton onClick={onClose} className='w-full'>
              Close
            </SecondaryButton>
          </>
        )

      case 'error':
        return (
          <>
            <div className='flex flex-col gap-2 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='text-2xl font-bold text-red-400'>Upgrade Failed</h2>
              <p className='line-clamp-6 text-red-400'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton onClick={() => setStep('review')} className='w-full'>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div
      onClick={() => {
        if (step !== 'processing') onClose()
      }}
      className='fixed inset-0 z-50 flex h-dvh w-screen items-end justify-end bg-black/50 backdrop-blur-sm md:items-center md:justify-center md:p-4'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background relative flex max-h-[calc(100dvh-80px)] w-full flex-col gap-4 overflow-y-auto border-t p-4 transition-all duration-300 md:max-w-md md:rounded-md md:border-2 md:p-6 starting:translate-y-full md:starting:translate-y-0'
      >
        <h2 className='font-sedan-sc min-h-6 text-center text-3xl'>Upgrade to ENSv2</h2>
        {renderContent()}
      </div>
    </div>
  )
}

export default MigrationModal
