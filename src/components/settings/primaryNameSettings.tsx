'use client'

import { NameListSkeleton, ReviewSkeleton } from '@/components/ui/ensSkeletons'
import { SkeletonText } from '@/components/ui/loadingSkeleton'

import Link from 'next/link'
import { Avatar, Check, DEFAULT_FALLBACK_AVATAR, ShortArrow, truncateAddress } from 'ethereum-identity-kit'
import { useUserContext } from '@/context/user'
import { usePrimaryName } from '@/hooks/settings/usePrimaryName'
import { beautifyName } from '@/lib/ens'
import NameImage from '@/components/ui/nameImage'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { cn } from '@/utils/tailwind'
import { useSettingsDirty } from '@/hooks/settings/useSettingsDirty'
import { QueryError, SettingsNotice } from './shared'
import { useConfigurationPreferences } from '@/hooks/settings/useResolverPreferences'
import { configurationName } from '@/utils/settings/labels'
import { getMetadataAssetUrl } from '@/utils/web3/ens'

const PrimaryNameSettings = () => {
  const { userAddress } = useUserContext()
  const editor = usePrimaryName()
  const name = editor.primary.data
  const selected = editor.selected
  const review = editor.review.data
  const preferences = useConfigurationPreferences(review?.resolver, selected?.version === 2 && !!review?.needsAddress)

  useSettingsDirty(editor.editing && editor.changed, editor.transaction.busy || editor.transaction.submitted)

  return (
    <div className='border-tertiary flex flex-col gap-4 rounded-md border p-4'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div className='flex min-w-0 items-center gap-3'>
          <Avatar
            key={name || userAddress}
            address={userAddress}
            name={name}
            src={name ? getMetadataAssetUrl(name, 'avatar') : DEFAULT_FALLBACK_AVATAR}
            style={{ width: 48, height: 48, minWidth: 48 }}
          />
          <div className='min-w-0'>
            <p className='truncate text-xl font-semibold'>
              {editor.primary.isLoading ? (
                <SkeletonText label='Loading primary name…' className='w-40' />
              ) : name ? (
                beautifyName(name)
              ) : (
                truncateAddress(userAddress!)
              )}
            </p>
            <p className='text-neutral text-lg'>Primary ENS name · {editor.chain.name}</p>
          </div>
        </div>
        {!editor.editing && (
          <SecondaryButton onClick={() => editor.setEditing(true)}>Change primary name</SecondaryButton>
        )}
      </div>
      {editor.primary.isError && <QueryError error={editor.primary.error} retry={() => editor.primary.refetch()} />}
      {editor.editing && (
        <>
          <Input
            label='Your names'
            labelClassName='shrink-0 whitespace-nowrap'
            value={editor.search}
            onChange={(event) => editor.setSearch(event.target.value)}
            placeholder='Search your names'
            disabled={editor.busy}
          />
          <div className='border-tertiary max-h-64 overflow-y-auto rounded-md border' aria-label='Your names'>
            {editor.options.map((option) => (
              <button
                key={`${option.version}:${option.name}`}
                type='button'
                aria-pressed={selected?.name === option.name && selected.version === option.version}
                disabled={editor.busy}
                onClick={() => editor.select(option)}
                className={cn(
                  'border-tertiary hover:bg-secondary flex w-full cursor-pointer items-center gap-3 border-b px-3 py-3 text-left text-lg transition-colors last:border-b-0 disabled:cursor-not-allowed',
                  selected?.name === option.name && selected.version === option.version && 'bg-secondary text-primary'
                )}
              >
                <NameImage
                  name={option.name}
                  tokenId={option.token_id}
                  version={option.version}
                  expiryDate={option.expiry_date}
                  width={32}
                  height={32}
                  className='shrink-0'
                />
                <span className='min-w-0 flex-1 truncate'>{beautifyName(option.name)}</span>
                <span className='text-neutral shrink-0 text-sm'>
                  V{option.version} · {editor.chain.name}
                </span>
                {selected?.name === option.name && selected.version === option.version && (
                  <Check className='h-4 w-4 shrink-0' />
                )}
              </button>
            ))}
            {editor.searching ? (
              <NameListSkeleton rows={editor.options.length ? 1 : 3} />
            ) : (
              !editor.options.length && (
                <p className='text-neutral p-3 text-lg'>No names found. Try searching for a full ENS name.</p>
              )
            )}
            {editor.names.hasNextPage && (
              <button
                type='button'
                className='text-primary w-full cursor-pointer p-3 text-lg'
                disabled={editor.searching}
                onClick={() => editor.names.fetchNextPage()}
              >
                Load more
              </button>
            )}
          </div>
          {editor.names.isError && <QueryError error={editor.names.error} retry={() => editor.names.refetch()} />}
          {selected && (
            <div className='flex flex-col gap-3'>
              <div className='flex min-w-0 items-center gap-2 text-lg'>
                <NameImage
                  name={selected.name}
                  tokenId={selected.token_id}
                  version={selected.version}
                  expiryDate={selected.expiry_date}
                  width={24}
                  height={24}
                  className='shrink-0'
                />
                <span className='truncate font-semibold'>{beautifyName(selected.name)}</span>
                <span className='text-neutral shrink-0'>· {editor.chain.name}</span>
              </div>
              {editor.review.isFetching && !review ? (
                <ReviewSkeleton label='Checking ownership and address record…' />
              ) : editor.review.isError ? (
                <QueryError error={editor.review.error} retry={() => editor.review.refetch()} />
              ) : review?.blocked ? (
                <SettingsNotice>
                  {review.blocked}{' '}
                  <Link href={`/${encodeURIComponent(selected.name)}`} className='text-primary underline'>
                    Manage records
                  </Link>
                </SettingsNotice>
              ) : review?.needsAddress ? (
                <SettingsNotice>
                  <div className='flex flex-col gap-3'>
                    <p>
                      This name must resolve to your wallet. Update its Ethereum address before setting your primary
                      name.
                    </p>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span title={review.address ?? undefined}>
                        {review.address ? truncateAddress(review.address) : 'No address set'}
                      </span>
                      <ShortArrow className='h-3.5 w-3.5 rotate-90' />
                      <span title={userAddress!}>{truncateAddress(userAddress!)}</span>
                    </div>
                    {selected.version === 2 && (
                      <p>
                        {review.usesDefault
                          ? `This changes the resolver’s ${configurationName(preferences.data, '0')}`
                          : `This changes ${configurationName(preferences.data, review.configurationId ?? BigInt(0))}`}{' '}
                        and affects every name using it. Use the{' '}
                        <Link href={`/${encodeURIComponent(selected.name)}`} className='text-primary underline'>
                          record editor
                        </Link>{' '}
                        to create a separate configuration if needed.
                      </p>
                    )}
                    <label className='flex cursor-pointer items-center gap-3 text-lg'>
                      <input
                        type='checkbox'
                        className='accent-primary h-5 w-5 shrink-0 cursor-pointer'
                        checked={editor.updateAddress}
                        disabled={editor.busy}
                        onChange={(event) => editor.setUpdateAddress(event.target.checked)}
                      />
                      Update the Ethereum address to my wallet
                    </label>
                  </div>
                </SettingsNotice>
              ) : (
                review && (
                  <p className='text-neutral text-lg'>
                    {editor.changed
                      ? 'This name already resolves to your wallet.'
                      : 'This is already your primary name.'}
                  </p>
                )
              )}
              {editor.review.isFetching && review && (
                <SkeletonText label='Checking ownership and address record…' className='w-48' />
              )}
            </div>
          )}
          <div className='flex gap-2'>
            <PrimaryButton className='w-1/2' disabled={!editor.canSave} onClick={editor.save}>
              Set primary name
            </PrimaryButton>
            <SecondaryButton className='w-1/2' disabled={editor.busy} onClick={editor.cancel}>
              Cancel
            </SecondaryButton>
          </div>
        </>
      )}
    </div>
  )
}

export default PrimaryNameSettings
