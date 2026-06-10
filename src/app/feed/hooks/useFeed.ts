import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import { ActivityTypeFilterType } from '@/types/filters/activity'
import { FeedTabValue } from '@/types/filters/feed'
import { FeedPlatformFilter } from '../components/activityTypeSidebar'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ReplyContext } from '../components/types'
import { useOwnerAddressLookup } from '@/hooks/comments/useOwnerAddressLookup'
import {
  FEED_TABS,
  TRENDING_ACTIVITY_FILTERS,
  TRENDING_ACTIVITY_TYPES,
  TRENDING_MIN_WEI,
} from '@/constants/filters/feed'
import { ethNumberToWei } from '@/utils/priceConvert'
import { useFeedScrollLock } from '@/hooks/comments/useFeedScrollLock'
import { useFeedViewport } from '@/hooks/comments/useFeedViewport'
import { FeedItemCommon, FeedItemType } from '@/types/api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getFeed } from '@/api/activity/feed'
import { FeedKind } from '@/types/filters/feed'
import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'

export const useFeed = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { userAddress, authStatus } = useUserContext()

  const filters = selectors.filters as any
  const selectedTab = filters.selectedTab.value as FeedTabValue
  const isFiltersOpen = filters.open as boolean

  const setIsFiltersOpen = (open: boolean) => {
    dispatch(actions.setFiltersOpen(open))
  }

  const showComments = selectedTab !== 'activity'
  const showActivity = selectedTab !== 'comments'
  const showCommentFilters = selectedTab !== 'activity'
  const showActivityFilters = selectedTab !== 'comments'
  const isTrending = selectedTab === 'trending'
  const isWatchlist = selectedTab === 'watchlist'

  const ownerInput = filters.search as string
  const selectedClubs = filters.categories as string[]
  const selectedActivityTypes = filters.type as ActivityTypeFilterType[]
  const visibleActivityTypeFilters = selectedTab === 'trending' ? TRENDING_ACTIVITY_FILTERS : ACTIVITY_TYPE_FILTERS
  const selectedPlatform = (
    filters.market.marketplace === 'none' ? 'all' : filters.market.marketplace
  ) as FeedPlatformFilter
  const minPriceEth = filters.price.min === null ? '' : String(filters.price.min)
  const maxPriceEth = filters.price.max === null ? '' : String(filters.price.max)

  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSeenNewestId = useRef<FeedItemCommon['id'] | null>(null)
  const isLoadingOlder = useRef(false)
  // Distance from the bottom captured before older items prepend, used to re-anchor the viewport.
  const prependAnchorRef = useRef<number | null>(null)

  const { ownerAddress, ownerEnsName, oppositeIdentifier, ownerError } = useOwnerAddressLookup(ownerInput)
  const activityEventTypes = useMemo(
    () =>
      isTrending
        ? selectedActivityTypes.length > 0
          ? selectedActivityTypes.filter((type) => TRENDING_ACTIVITY_TYPES.includes(type))
          : TRENDING_ACTIVITY_TYPES
        : selectedActivityTypes,
    [isTrending, selectedActivityTypes]
  )
  const activityPlatform = selectedPlatform === 'all' ? undefined : selectedPlatform
  const selectedMinPriceWei = ethNumberToWei(filters.price.min)
  const selectedMaxPriceWei = ethNumberToWei(filters.price.max)
  const minPriceWei = selectedMinPriceWei ?? (isTrending ? TRENDING_MIN_WEI : undefined)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: [
      'feed',
      selectedTab,
      ownerAddress,
      selectedClubs,
      activityEventTypes,
      activityPlatform,
      minPriceWei,
      selectedMaxPriceWei,
      isWatchlist,
      userAddress,
      authStatus,
    ],
    queryFn: async ({ pageParam }) => {
      const kinds: FeedKind[] = []
      if (showActivity) kinds.push('activity')
      if (showComments) kinds.push('comment')
      const response = await getFeed({
        kinds,
        owner: ownerAddress,
        clubs: selectedClubs,
        page: pageParam,
        limit: 20,
        watchlist: isWatchlist,
        priceRange: {
          min: minPriceWei,
          max: selectedMaxPriceWei,
        },
        eventTypes: activityEventTypes,
        platform: activityPlatform,
      })

      return {
        results: response.data.results,
        pagination: response.data.pagination,
        hasNextPage: response.data.pagination.hasNext,
        hasPreviousPage: response.data.pagination.hasPrev,
      }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
  })

  const feedItems = useMemo<FeedItemType[]>(() => data?.pages.flatMap((page) => page.results).reverse() ?? [], [data])

  useFeedScrollLock()
  const { viewport, viewportStyle } = useFeedViewport()
  const isInitialLoading = isLoading
  const isFetchingMore = isFetchingNextPage
  const hasMore = !!hasNextPage

  const selectedFilterCount =
    selectedClubs.length +
    (ownerInput && showCommentFilters ? 1 : 0) +
    (selectedPlatform !== 'all' && showActivityFilters ? 1 : 0) +
    (minPriceEth && showActivityFilters ? 1 : 0) +
    (maxPriceEth && showActivityFilters ? 1 : 0) +
    (showActivityFilters ? selectedActivityTypes.length : 0)
  const canClearFilters = selectedFilterCount > 0

  useEffect(() => {
    if (!isTrending) return
    const nextTypes = selectedActivityTypes.filter((type) => TRENDING_ACTIVITY_TYPES.includes(type))
    if (nextTypes.length !== selectedActivityTypes.length) dispatch(actions.setFiltersType(nextTypes))
  }, [actions, dispatch, isTrending, selectedActivityTypes])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || feedItems.length === 0) return

    if (isLoadingOlder.current) {
      if (prependAnchorRef.current !== null) {
        el.scrollTop = el.scrollHeight - prependAnchorRef.current
        prependAnchorRef.current = null
      }
      isLoadingOlder.current = false
      return
    }

    // scroll to botton on initial load, or newer items arriving at the bottom
    const newest = feedItems[feedItems.length - 1]
    if (lastSeenNewestId.current !== newest.id) {
      el.scrollTop = el.scrollHeight
      lastSeenNewestId.current = newest.id
    }
  }, [feedItems])

  const loadMore = async () => {
    if (isFetchingMore || !hasNextPage) return
    const el = scrollRef.current
    // capture distance from the bottom, then recalculate the distance once the items render.
    prependAnchorRef.current = el ? el.scrollHeight - el.scrollTop : 0
    isLoadingOlder.current = true
    await fetchNextPage()
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 200) loadMore()
  }

  const toggleActivityType = (type: ActivityTypeFilterType) => {
    dispatch(actions.toggleFiltersType(type))
  }

  const setSelectedTab = (tab: FeedTabValue) => {
    const tabObject = FEED_TABS.find((item) => item.value === tab) ?? FEED_TABS[0]
    dispatch((actions as any).setSelectedTab(tabObject))
  }

  const setOwnerInput = (value: string) => dispatch(actions.setSearch(value))

  const setSelectedClubs = (clubs: string[]) => {
    dispatch((actions as any).removeCategories(selectedClubs.filter((club) => !clubs.includes(club))))
    dispatch((actions as any).addCategories(clubs.filter((club) => !selectedClubs.includes(club))))
  }

  const setSelectedPlatform = (platform: FeedPlatformFilter) => {
    dispatch(
      actions.setMarketFilters({
        ...filters.market,
        marketplace: platform === 'all' ? 'none' : platform,
      })
    )
  }

  const setMinPriceEth = (value: string) => {
    dispatch(actions.setPriceRange({ ...filters.price, min: value ? Number(value) : null }))
  }

  const setMaxPriceEth = (value: string) => {
    dispatch(actions.setPriceRange({ ...filters.price, max: value ? Number(value) : null }))
  }

  return {
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
    visibleActivityTypeFilters,
  }
}
