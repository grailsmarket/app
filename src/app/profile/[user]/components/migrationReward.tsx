'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Address } from 'viem'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import { COMMEMORATIVE_NFT_ADDRESS } from '@/constants/web3/abi/CommemorativeNFT'
import { activeChain } from '@/constants/web3/chain'
import { useMigrationReward } from '@/hooks/migration/useMigrationReward'
import { cn } from '@/utils/tailwind'
import styles from './migrationReward.module.css'

export const MigrationRewardBanner = ({ reward }: { reward: ReturnType<typeof useMigrationReward> }) => {
  const {
    nft,
    claimed: claimStatus,
    assets,
    progress,
    transaction,
    canClaim,
    canMigrate,
    claim,
    migrate,
    retry,
  } = reward
  const [failedImage, setFailedImage] = useState<string>()
  const claimed = claimStatus.data
  const error = !claimed && (claimStatus.isError || nft.isError || progress.isError)
  const loading = !claimed && (claimStatus.isPending || nft.isPending || progress.isPending)
  const checking = !claimed && (claimStatus.isFetching || nft.isFetching || progress.isFetching)
  const migrated = progress.data?.migrated ?? 0
  const remaining = progress.data?.remaining ?? 0
  const total = migrated + remaining
  const ready = !error && !loading && !claimed && !!nft.data?.eligible && remaining === 0 && migrated > 0
  const hasRemaining = !error && !loading && !claimed && !!nft.data?.eligible && remaining > 0
  const imageUrl = nft.data?.imageUrl ?? (claimed ? assets.imageUrl : undefined)

  if (nft.data?.eligible === false && claimStatus.isSuccess && !claimed) return null

  return (
    <section
      aria-label='ENS commemorative NFT'
      className={cn(styles.banner, ready && styles.ready, 'border-tertiary border-b px-5 py-6 md:px-8')}
    >
      <div className='relative grid grid-cols-[80px_minmax(0,1fr)] items-center gap-x-5 gap-y-5 sm:grid-cols-[104px_minmax(0,1fr)] md:grid-cols-[104px_minmax(0,1fr)_auto] md:gap-x-8'>
        <div className={styles.artwork}>
          {imageUrl && imageUrl !== failedImage ? (
            <Image
              src={imageUrl}
              alt={nft.data?.name ?? 'ENS commemorative NFT'}
              width={104}
              height={132}
              unoptimized
              className='h-full w-full object-contain'
              onError={() => setFailedImage(imageUrl)}
            />
          ) : (
            <div className={styles.placeholder} aria-label='ENS commemorative NFT artwork'>
              <Image src='/logos/ens-white.svg' alt='' width={34} height={39} />
              <span>ENS V2</span>
            </div>
          )}
        </div>
        <div className='min-w-0'>
          <p className='text-primary mb-2 text-xs font-semibold tracking-[0.16em] uppercase'>
            ENS V2 · Commemorative NFT
          </p>
          <h2 className='text-2xl leading-tight font-semibold md:text-3xl'>
            {claimed
              ? 'Your ENS milestone, collected'
              : ready
                ? 'Your commemorative NFT is ready'
                : 'Celebrate your move to ENS V2'}
          </h2>
          <p className='text-neutral mt-2 max-w-2xl text-lg leading-relaxed'>
            {claimed
              ? 'A keepsake for the names you brought into a new chapter of ENS.'
              : ready
                ? 'All your eligible names have migrated. Claim your piece of ENS history.'
                : 'Migrate your eligible names to V2 to unlock your commemorative NFT.'}
          </p>
          {!claimed && (
            <div className='mt-4 max-w-xl' aria-live='polite'>
              {error ? (
                <p role='alert' className='text-lg'>
                  We couldn’t check your migration progress. Please try again.
                </p>
              ) : loading ? (
                <div role='status'>
                  <span className='text-neutral text-md'>Checking your migration progress…</span>
                  <div className='bg-tertiary mt-2 h-1.5 rounded-full' />
                </div>
              ) : (
                <>
                  <div className='text-md mb-2 flex flex-wrap justify-between gap-x-3 gap-y-1'>
                    <span>
                      <strong className='text-primary font-semibold'>{migrated.toLocaleString()}</strong>
                      <span className='text-neutral'> / {total.toLocaleString()} names migrated</span>
                    </span>
                    <span className='text-neutral'>
                      {remaining > 0
                        ? `${remaining.toLocaleString()} ${remaining === 1 ? 'name' : 'names'} left`
                        : migrated > 0
                          ? 'Migration complete'
                          : 'No migrated names yet'}
                    </span>
                  </div>
                  <div
                    role='progressbar'
                    aria-label='Names migrated to ENS V2'
                    aria-valuemin={0}
                    aria-valuemax={total || 1}
                    aria-valuenow={migrated}
                    aria-valuetext={`${migrated} of ${total} names migrated`}
                    className='bg-tertiary h-1.5 overflow-hidden rounded-full'
                  >
                    <div
                      className='bg-primary h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none'
                      style={{ width: `${total ? (migrated / total) * 100 : 0}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {(claimed || error || ready || hasRemaining) && (
          <div className='col-span-2 flex flex-col items-center gap-2 md:col-span-1 md:items-end'>
            {claimed ? (
              <a
                href={`https://etherscan.io/nft/${COMMEMORATIVE_NFT_ADDRESS}/${assets.tokenId}`}
                target='_blank'
                rel='noopener noreferrer'
                className='border-primary/30 text-primary hover:bg-primary/10 rounded-sm border px-5 py-2.5 text-lg font-semibold transition-colors'
              >
                View your NFT ↗
              </a>
            ) : error ? (
              <SecondaryButton disabled={checking} onClick={retry}>
                {checking ? 'Checking…' : 'Try again'}
              </SecondaryButton>
            ) : hasRemaining ? (
              <PrimaryButton className='h-11 w-full px-6 md:w-auto' disabled={!canMigrate} onClick={migrate}>
                {checking ? 'Checking…' : 'Migrate now'}
              </PrimaryButton>
            ) : (
              <>
                <PrimaryButton
                  className={cn(styles.claim, 'h-11 w-full px-6 md:w-auto')}
                  disabled={!canClaim || checking || transaction.busy || transaction.pending}
                  onClick={() => void claim()}
                >
                  {transaction.busy ? 'Claiming…' : checking ? 'Checking…' : 'Claim NFT'}
                </PrimaryButton>
                <p className='text-neutral text-md'>No mint fee · network gas only</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

const MigrationRewardContent = ({ owner }: { owner: Address }) => (
  <MigrationRewardBanner reward={useMigrationReward(owner)} />
)

const MigrationReward = ({ owner }: { owner: Address }) =>
  activeChain.id === 1 ? (
    <SettingsTransactionProvider key={owner}>
      <MigrationRewardContent owner={owner} />
    </SettingsTransactionProvider>
  ) : null

export default MigrationReward
