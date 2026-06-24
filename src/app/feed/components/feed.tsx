'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import FeedFilters from './feedFilters'
import FeedCommentCard from './feedCommentCard'
import FeedActivityCard from './feedActivityCard'
import FilterSidebar from './filterSidebar'
import ReplyPreview from './replyPreview'
import FeedComposer from './feedComposer'
import FeedLoading from './feedLoading'
import SignInButton from '@/components/ui/buttons/signInButton'
import { useFeed } from '../hooks/useFeed'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'

const Feed: React.FC = () => {
  const dispatch = useAppDispatch()
  const { actions } = useFilterRouter()
  const {
    feedItems,
    isInitialLoading,
    isFetchingMore,
    hasMore,
    canClearFilters,
    loadMore,
    handleScroll,
    toggleActivityType,
    setSelectedTab,
    setOwnerInput,
    setSelectedClubs,
    setSelectedPlatform,
    setMinPriceEth,
    setMaxPriceEth,
    setReplyContext,
    setSelectedName,
    setIsFiltersOpen,
    scrollRef,
    isFiltersOpen,
    selectedName,
    replyContext,
    viewport,
    viewportStyle,
    ownerEnsName,
    oppositeIdentifier,
    ownerError,
    selectedTab,
    selectedFilterCount,
    selectedActivityTypes,
    showCommentFilters,
    showActivityFilters,
    authStatus,
    ownerInput,
    selectedClubs,
    selectedPlatform,
    minPriceEth,
    maxPriceEth,
    isWatchlist,
    isFriends,
    efpUnavailable,
    visibleActivityTypeFilters,
  } = useFeed()

  return (
    <div
      style={{
        ...viewportStyle,
        right: 'var(--chat-sidebar-width, 0px)',
        transition:
          'height 250ms cubic-bezier(0.32,0.72,0,1), top 250ms cubic-bezier(0.32,0.72,0,1), right var(--chat-sidebar-anim-duration, 250ms) cubic-bezier(0, 0, 0.58, 1)',
      }}
      className={cn(
        'fixed left-0 mx-auto flex h-[calc(100dvh-54px)] w-full flex-col md:absolute md:inset-0 md:h-full',
        viewport ? '' : 'top-[54px] md:top-0'
      )}
    >
      <FeedFilters
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        selectedFilterCount={selectedFilterCount}
        filtersOpen={isFiltersOpen}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
      />

      <div className='relative flex min-h-0 flex-1 flex-col @[64rem]/app:flex-row'>
        <FilterSidebar
          isOpen={isFiltersOpen}
          selectedTypes={selectedActivityTypes}
          onToggleType={toggleActivityType}
          activityTypeFilters={visibleActivityTypeFilters}
          showCommentFilters={showCommentFilters}
          showActivityFilters={showActivityFilters}
          ownerInput={ownerInput}
          onOwnerInputChange={setOwnerInput}
          ownerName={ownerEnsName}
          oppositeIdentifier={oppositeIdentifier}
          ownerError={ownerError}
          selectedClubs={selectedClubs}
          onSelectedClubsChange={setSelectedClubs}
          platform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          minPriceEth={minPriceEth}
          maxPriceEth={maxPriceEth}
          onMinPriceEthChange={setMinPriceEth}
          onMaxPriceEthChange={setMaxPriceEth}
          canClear={canClearFilters}
          onClear={() => {
            setOwnerInput('')
            setSelectedClubs([])
            dispatch(actions.setFiltersType([]))
            setSelectedPlatform('all')
            setMinPriceEth('')
            setMaxPriceEth('')
          }}
        />
        {isFiltersOpen && (
          <button
            type='button'
            aria-label='Close filters'
            onClick={() => setIsFiltersOpen(false)}
            className='absolute inset-0 z-30 cursor-default bg-black/20 @[40rem]/app:hidden'
          />
        )}
        <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
          <div className='relative min-h-0 flex-1'>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className='h-full min-h-0 w-full overflow-y-auto py-4'
              onClick={() => {
                if (replyContext) {
                  setReplyContext(null)
                  setSelectedName(null)
                }
              }}
            >
              <div className='mx-auto max-w-5xl px-3 @[40rem]/app:px-5'>
                {isInitialLoading ? (
                  <FeedLoading />
                ) : (isWatchlist || isFriends) && authStatus !== 'authenticated' ? (
                  <div className='flex h-full min-h-[280px] flex-col items-center justify-center gap-4 text-center'>
                    <p className='text-neutral text-lg'>
                      {isFriends
                        ? 'Sign in to see activity from accounts you follow'
                        : 'Sign in to view your watchlist feed'}
                    </p>
                    <SignInButton />
                  </div>
                ) : efpUnavailable ? (
                  <div className='flex h-full min-h-[280px] flex-col items-center justify-center gap-2 text-center'>
                    <p className='text-neutral text-lg'>EFP is currently unavailable</p>
                    <p className='text-neutral/70 text-sm'>
                      We couldn&apos;t load the accounts you follow. Please try again later.
                    </p>
                  </div>
                ) : feedItems.length === 0 ? (
                  <div className='flex h-full min-h-[280px] items-center justify-center text-center'>
                    <p className='text-neutral text-lg'>No feed events found for these filters.</p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'flex flex-col gap-3 transition-all duration-200',
                      replyContext && 'pointer-events-none opacity-40 blur-[2px] select-none'
                    )}
                  >
                    {isFetchingMore && <FeedLoading count={3} />}
                    {hasMore && !isFetchingMore && (
                      <button type='button' onClick={loadMore} className='text-primary py-2 text-sm font-semibold'>
                        Load older feed events
                      </button>
                    )}
                    {feedItems.map((item, index) =>
                      item.kind === 'comment' ? (
                        <FeedCommentCard
                          key={`comment-${item.id}-${index}`}
                          comment={{
                            id: item.id,
                            ens_name_id: item.ens_name_id,
                            name: item.name,
                            body: item.comment.body,
                            created_at: item.created_at,
                            author_address: item.comment.author_address,
                            owner_address: item.owner_address,
                            clubs: item.clubs,
                          }}
                          onReply={(context) => {
                            setSelectedName(context.name)
                            setReplyContext(context)
                          }}
                        />
                      ) : (
                        <FeedActivityCard
                          key={`activity-${item.id}-${index}`}
                          activity={{
                            id: item.id,
                            ens_name_id: item.ens_name_id,
                            name: item.name,
                            event_type: item.activity.event_type,
                            created_at: item.created_at,
                            actor_address: item.activity.actor_address,
                            counterparty_address: item.activity.counterparty_address,
                            platform: item.activity.platform,
                            chain_id: item.activity.chain_id,
                            price_wei: item.activity.price_wei,
                            currency_address: item.activity.currency_address,
                            transaction_hash: item.activity.transaction_hash,
                            block_number: item.activity.block_number,
                            price: item.activity.price,
                            token_id: item.activity.token_id,
                            clubs: item.clubs,
                            metadata: item.activity.metadata,
                          }}
                          onReply={(name) => {
                            setSelectedName(name)
                            setReplyContext(null)
                          }}
                        />
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {replyContext && (
              <ReplyPreview
                context={replyContext}
                onClear={() => {
                  setSelectedName(null)
                  setReplyContext(null)
                }}
              />
            )}
          </div>

          <FeedComposer
            selectedName={selectedName}
            onSubmitSuccess={() => setReplyContext(null)}
            onSelectedNameChange={(name) => {
              setSelectedName(name)
              setReplyContext(null)
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Feed
