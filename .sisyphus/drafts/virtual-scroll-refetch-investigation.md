# Draft: Virtual Scroll Refetch Investigation

## Requirements (confirmed)
- User reports that after scrolling far down (~15 pages or more), items in the virtual list reload on every scroll up/down.
- The reload causes hundreds or thousands of network requests every couple seconds.
- Goal: investigate why this happens and build a plan to fix it.
- Do not implement directly in this planning session.

## Current Branch / State
- Branch observed: `feat/tanstack-virtual-migration-v2`.
- Working tree note: `test-results/` is untracked.
- Current migrated components under review:
  - `src/components/ui/virtuallist.tsx`
  - `src/components/ui/virtualgrid.tsx`

## Initial Findings

### VirtualList current implementation
- `VirtualListWindowInner` uses `useWindowVirtualizer` with:
  - `count: items.length`
  - `estimateSize: () => rowHeight + gap`
  - `overscan: overscanCount`
  - `getItemKey: (index) => index`
  - `useFlushSync: false`
  - `scrollMargin: elementTop`
- `virtualItems = virtualizer.getVirtualItems()` is consumed directly.
- Item wrapper key is `key={vi.key}` where `vi.key` is the index because `getItemKey` returns index.
- Window-mode persistence currently computes `relativeScrollTop` from `window.scrollY` during render, but there is no window scroll listener in `VirtualListWindowInner` anymore. This may mean Redux scroll updates only happen when some other state causes a render.
- `onScrollNearBottom` effect depends on `virtualItems` and checks only when `lastItem.index >= items.length - 1`, which differs from the old threshold-only behavior.
- Window mode removed the explicit `scrollState` scroll listener that existed before migration. TanStack's virtualizer re-renders on scroll, but Redux persistence now depends on those renders instead of an explicit scroll-state update.

### VirtualGrid current implementation
- Uses one row `useWindowVirtualizer` with `getItemKey: (i) => i`.
- Manual columns render inside virtual row using `key={index}`.
- Has an explicit `scrollState` listener, unlike `VirtualListWindowInner`.

## Hypotheses to validate
1. **Index keys cause remount/refetch churn after pagination or list mutation**.
   - If `items` grows, prepends, dedupes, or reorders, `key={index}` can attach the wrong identity to a row.
   - Row children that fetch on mount would refetch as indexes are recycled.
2. **Virtual row wrapper remounts are expected, but row child fetches are not cached/stabilized**.
   - Virtualization unmounts offscreen items by design.
   - If row/card children fetch on every mount without cache, deep scroll causes request storms.
3. **Virtualizer options and render callbacks may be unstable, causing excessive recalculation**.
   - `estimateSize`, `getItemKey`, `getScrollElement` are inline functions.
   - TanStack generally handles options updates, but unstable identities could amplify work.
4. **Scroll restore/persist dispatch may trigger parent filter state changes while scrolling**.
   - `setStoredScrollTop` dispatches Redux updates; if parent selectors derive `items` or `renderItem` from filter state, scroll writes could re-render the entire list.
5. **Near-bottom callback may over-fetch repeatedly at deep scroll positions**.
   - Current check with last rendered item could repeatedly trigger while near bottom unless caller guards pending state.

## Additional Direct Findings

### Consumer-side pagination guards
- Marketplace `Domains` passes `onScrollNearBottom={handleScrollNearBottom}` to both `VirtualGrid` and `VirtualList` at `src/components/domains/index.tsx:225-264`.
- Leaderboard uses `if (hasNextPage && !isFetchingNextPage) fetchNextPage()` in `src/app/leaderboard/components/LeaderboardList.tsx:118-122`.
- Categories all holders and category holders use the same `hasNextPage && !isFetchingNextPage` guard at:
  - `src/app/categories/components/allHoldersPanel.tsx:31-35`
  - `src/app/categories/[category]/components/holders.tsx:35-39`
- If requests are truly firing hundreds/thousands of times, either:
  1. `onScrollNearBottom` is being invoked repeatedly faster than `isFetchingNextPage` can update, or
  2. requests are not pagination requests; they are row-child fetches triggered by remounts.

### Row/card child fetches discovered directly
- `src/components/domains/table/components/Price.tsx:43-51`: `useQuery({ queryKey: ['brokerAccount', listing?.broker_address], queryFn: fetchAccount(...) })`.
- `src/components/domains/grid/components/card.tsx:90-98`: same broker account `useQuery` per card.
- `src/components/ui/user.tsx:45` (needs follow-up): `useQuery` likely fetches profile data for holder/leaderboard rows.
- `NameImage` and `next/image` appear in many row/card children; remounting could cause image reloads if not browser-cached.

### Likely high-impact mechanism
- Virtualization intentionally unmounts offscreen rows. If each row contains uncached or short-cache child queries (e.g. `fetchAccount`, profile fetches, images), deep scrolling remounts many rows and can create a request storm.
- Stable keys at the *child component* level (`TableRow key={item.token_id}`, `Card key={item.token_id}`) do not prevent unmounting if the parent virtual wrapper itself is unmounted when the item leaves the virtual window.
- Fixing only `getItemKey` may reduce identity churn among overlapping virtual items, but it will not stop expected unmount/remount for items outside overscan. Row fetches must be cached or hoisted.

## Research Findings

### Row/card fetch mapping agent (`bg_17b0ef5d`)
- `VirtualList` and `VirtualGrid` virtual wrappers are keyed by index (`getItemKey: (index) => index`). Stable keys passed inside `renderItem` do not prevent remount when the parent virtual wrapper leaves the rendered range.
- Rows/cards contain many mount-triggered data/image operations:
  - `User` profile fetch: `src/components/ui/user.tsx:45-53`, used in domains, offers, activity, leaderboard, and holder rows.
  - Broker fetch: `src/components/domains/table/components/Price.tsx:43-51` and `src/components/domains/grid/components/card.tsx:90-98`.
  - `NameImage` remote wrapped/unwrapped/fallback image chain: `src/components/ui/nameImage.tsx:30-51`.
  - `Watchlist` check: `src/hooks/useWatchlist.ts:85-106`, likely high-volume for authenticated marketplace table rows.
  - Categories query: `useCategories()` / `fetchCategories()` appears in multiple row/card components.
- Recommendation from agent: add explicit `staleTime`, `gcTime`, `refetchOnMount: false`, and `refetchOnWindowFocus: false` for stable row lookups; hoist shared queries out of row components where possible; cache `NameImage` failed URL fallback state externally.

### TanStack docs agent (`bg_389d8409`)
- TanStack `getItemKey` defaults to index; docs recommend overriding with stable unique IDs and memoizing it.
- Virtual item `key` is used for DOM and measurement caches; index keys follow position, not row identity.
- React adapter keeps a stable virtualizer instance and updates options in place.
- `scrollMargin` must be subtracted from item translation in window virtualizer examples. Official examples use `translateY(virtualRow.start - scrollMargin)`.
- `overscan` default is 1; higher overscan reduces blank gaps but increases mounted rows.
- `useFlushSync: false` is recommended for perf-sensitive scrolling / React 19 warning avoidance.

### Code analysis agent (`bg_3464c1a3`)
Ranked likely root causes:
1. **Window virtualizer `scrollMargin` is configured but not subtracted from item positioning**:
   - `virtuallist.tsx:98` sets `scrollMargin: elementTop`, but `virtuallist.tsx:161` uses `top: vi.start`.
   - `virtualgrid.tsx:155` sets `scrollMargin: elementTop`, but `virtualgrid.tsx:198` uses `top: vRow.start`.
   - Fix: use `top: 0` + `transform: translateY(vi.start - virtualizer.options.scrollMargin)` in window mode.
2. **Virtualized rows remount by design; row children refetch/reload on mount**:
   - Profile, broker, category, watchlist, and image lookups are the request storm amplifiers.
3. **Redux scrollTop persistence causes broad rerenders during scroll**:
   - 100ms debounced `setScrollTop` updates filter Redux state while actively scrolling.
   - This recreates inline `items={[...domains, ...]}` and `renderItem` closures in consumers.
4. **Index keys are fragile with loading/null/sort transitions**:
   - Stable child keys help only while mounted; wrapper keys still use index.

## Fix Plan Decisions
- First fix window `scrollMargin` positioning. This is the most direct correctness issue and may explain severe range churn at deep scroll positions.
- Add an internal optional stable key resolver without changing public API: infer `token_id`, `id`, `address`, `name`, then fall back to index. For null loading rows, keep index/fallback.
- Add explicit cache policies to row-level fetches before hoisting data, because cache policy is lower-risk and preserves component boundaries.
- Cache `NameImage` fallback decisions by name/hash to avoid repeating wrapped→unwrapped→fallback retries on every remount.
- Reduce scrollTop Redux writes from every 100ms during active scroll to idle/throttled writes, preserving restoration semantics but limiting global rerenders.

## Open Questions
- Which route/list was observed? Marketplace domains list, offers, activity, leaderboard, categories, or all?
- Are requests caused by infinite pagination (`onScrollNearBottom`) or by per-row child fetches/images/profiles?
- Did the user's fixes after the PR alter `virtuallist.tsx`/`virtualgrid.tsx` beyond what is currently in this working tree?

## Scope Boundaries
- INCLUDE: diagnostic plan for `VirtualList`, `VirtualGrid`, virtualized consumers, row/card fetch behavior, key stability, and scroll-triggered Redux dispatch.
- EXCLUDE: direct implementation during planning; unrelated UI redesign; changes to public component API unless explicitly planned with compatibility.
