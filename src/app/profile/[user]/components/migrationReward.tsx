'use client'

import { useEffect, useRef } from 'react'
import { Cross } from 'ethereum-identity-kit'
import CommemorativeArtwork, { useArtworkTilt } from '@/components/migration/commemorativeArtwork'
import type { Address } from 'viem'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { SettingsTransactionProvider } from '@/context/settingsTransaction'
import { COMMEMORATIVE_NFT_ADDRESS } from '@/constants/web3/abi/CommemorativeNFT'
import { activeChain } from '@/constants/web3/chain'
import { useMigrationReward } from '@/hooks/migration/useMigrationReward'
import {
  MIGRATION_REWARD_ID,
  setMigrationRewardDismissed,
  useMigrationRewardDismissed,
} from '@/hooks/migration/useMigrationRewardVisibility'
import { cn } from '@/utils/tailwind'
import styles from './migrationReward.module.css'

export const MigrationRewardBanner = ({
  reward,
  onDismiss,
}: {
  reward: ReturnType<typeof useMigrationReward>
  onDismiss?: () => void
}) => {
  const {
    nft,
    claimed: claimStatus,
    assets,
    progress,
    syncing,
    transaction,
    canClaim,
    canMigrate,
    claim,
    migrate,
    retry,
  } = reward
  const artwork = useArtworkTilt()
  const claimed = claimStatus.data
  const error = !claimed && (claimStatus.isError || nft.isError || progress.isError)
  const loading = !claimed && (claimStatus.isPending || nft.isPending || progress.isPending || syncing)
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
      className={cn(styles.banner, ready && styles.ready, 'border-tertiary border-b px-4 py-6 @[40rem]/app:px-8')}
      onPointerMove={artwork.track}
      onPointerLeave={artwork.release}
    >
      {onDismiss && (
        <button
          type='button'
          onClick={onDismiss}
          disabled={transaction.busy || transaction.pending}
          aria-label='Dismiss ENS commemorative banner'
          title='Dismiss banner. Reopen from the wallet menu.'
          className='text-neutral hover:text-foreground hover:bg-tertiary focus-visible:outline-primary absolute top-2 right-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-2 disabled:cursor-default disabled:opacity-50'
        >
          <Cross className='h-3 w-3' />
        </button>
      )}
      <div className='grid grid-cols-[88px_minmax(0,1fr)] items-center gap-x-4 gap-y-5 @[40rem]/app:grid-cols-[112px_minmax(0,600px)] @[40rem]/app:gap-x-8 @[40rem]/app:gap-y-4 @[64rem]/app:grid-cols-[128px_minmax(0,640px)]'>
        <CommemorativeArtwork
          artwork={artwork}
          imageUrl={imageUrl}
          name={nft.data?.name}
          className='@[40rem]/app:row-span-2'
        />
        <div className={cn('min-w-0 @[40rem]/app:self-end', onDismiss && 'pr-6')}>
          <h2 className='font-sedan-sc text-2xl leading-tight @[40rem]/app:text-3xl @[64rem]/app:text-4xl'>
            {claimed
              ? 'Your ENS milestone, collected'
              : ready
                ? 'Your commemorative NFT is ready'
                : 'Celebrate your move to ENS V2'}
          </h2>
          <p className='text-neutral mt-1.5 text-lg leading-normal'>
            {claimed
              ? 'A keepsake for the names you brought into a new chapter of ENS.'
              : ready
                ? 'All your eligible names have migrated. Claim your piece of ENS history.'
                : 'Migrate your eligible names to V2 to unlock your commemorative NFT.'}
          </p>
        </div>
        <div
          className={cn(
            'col-span-2 grid items-center gap-x-6 gap-y-3 @[40rem]/app:col-span-1 @[40rem]/app:col-start-2 @[40rem]/app:self-start',
            !claimed && '@[40rem]/app:grid-cols-[minmax(0,1fr)_auto]'
          )}
        >
          {!claimed && (
            <div className='min-w-0' aria-live='polite'>
              {error ? (
                <p role='alert' className='text-lg'>
                  We couldn’t check your migration progress. Please try again.
                </p>
              ) : loading ? (
                <div role='status'>
                  <span className='text-neutral text-md'>
                    {syncing
                      ? 'Updating your names. We’ll recheck automatically…'
                      : 'Checking your migration progress…'}
                  </span>
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
                      className={cn(
                        styles.fill,
                        'h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none'
                      )}
                      style={{ width: `${total ? (migrated / total) * 100 : 0}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          {claimed ? (
            <div className='flex flex-wrap items-center gap-3'>
              <a
                href={assets.openSeaUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='border-primary-line text-primary hover:bg-primary-soft flex h-10 w-full items-center justify-center rounded-sm border px-5 text-lg font-bold transition-colors @[40rem]/app:w-fit'
              >
                View on OpenSea ↗
              </a>
              <a
                href={`https://etherscan.io/nft/${COMMEMORATIVE_NFT_ADDRESS}/${assets.tokenId}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-neutral hover:text-primary text-md mx-0 hidden transition-colors @[40rem]/app:block'
              >
                View on Etherscan ↗
              </a>
            </div>
          ) : error ? (
            <SecondaryButton className='h-10 w-full px-6' disabled={checking} onClick={retry}>
              {checking ? 'Checking…' : 'Try again'}
            </SecondaryButton>
          ) : hasRemaining ? (
            <PrimaryButton
              className='hover:bg-primary-hover disabled:hover:bg-primary h-10 w-full px-6 hover:opacity-100'
              disabled={!canMigrate}
              onClick={migrate}
            >
              {checking ? 'Checking…' : 'Migrate now'}
            </PrimaryButton>
          ) : (
            ready && (
              <>
                <PrimaryButton
                  className={cn(
                    styles.claim,
                    'hover:bg-primary-hover disabled:hover:bg-primary h-10 w-full px-6 hover:opacity-100'
                  )}
                  disabled={!canClaim || checking || transaction.busy || transaction.pending}
                  onClick={() => void claim()}
                >
                  {transaction.busy ? 'Claiming…' : checking ? 'Checking…' : 'Claim NFT'}
                </PrimaryButton>
                <p className='text-neutral text-md text-center @[40rem]/app:col-start-2'>
                  No mint fee · network gas only
                </p>
              </>
            )
          )}
        </div>
      </div>
    </section>
  )
}

const MigrationRewardContent = ({ owner }: { owner: Address }) => {
  const dismissed = useMigrationRewardDismissed(owner)
  const reward = useMigrationReward(owner, !dismissed)
  const banner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.location.hash !== `#${MIGRATION_REWARD_ID}`) return
    setMigrationRewardDismissed(owner, false)
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    requestAnimationFrame(() => banner.current?.scrollIntoView({ block: 'start' }))
  }, [owner])

  return (
    <div ref={banner} id={MIGRATION_REWARD_ID} data-owner={owner.toLowerCase()} className='scroll-mt-20'>
      {!dismissed && (
        <MigrationRewardBanner reward={reward} onDismiss={() => setMigrationRewardDismissed(owner, true)} />
      )}
    </div>
  )
}

const MigrationReward = ({ owner }: { owner: Address }) =>
  activeChain.id === 1 ? (
    <SettingsTransactionProvider key={owner}>
      <MigrationRewardContent owner={owner} />
    </SettingsTransactionProvider>
  ) : null

export default MigrationReward
