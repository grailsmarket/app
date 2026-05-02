# Fix Virtual Scroll Deep-Scroll Refetch Storm

## TL;DR

> **Quick Summary**: Investigate and fix the deep-scroll reload/request storm after the TanStack Virtual migration by first proving which URLs are storming, then correcting window-virtualizer `scrollMargin` positioning, stabilizing virtual item identity, reducing scroll-induced Redux churn, and hardening row-level stable lookup caches.
>
> **Deliverables**:
> - Network instrumentation that reproduces the 15+ page scroll issue and identifies request sources.
> - Correct `scrollMargin` positioning in `VirtualList` and `VirtualGrid` window modes.
> - Internal stable item-key resolver with no public API changes.
> - Query/cache hardening for stable profile/broker/category/watchlist lookups.
> - `NameImage` fallback cache if image retry chains are confirmed.
> - Deep-scroll Playwright regression that fails on request storms.
>
> **Estimated Effort**: Medium
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Network baseline → scrollMargin fix → query/cache fixes → deep-scroll regression → review

---

## Context

### Original Request
User tested the TanStack Virtual migration and found that after scrolling far down (~15 pages or more), virtual-list items reload whenever scrolling up or down, generating hundreds/thousands of requests every few seconds.

### Key Findings

1. **Concrete TanStack migration mismatch**: window virtualizers set `scrollMargin: elementTop`, but rendered items currently use raw `top: vi.start` / `top: vRow.start`.
   - `src/components/ui/virtuallist.tsx:92-99`, `155-170`
   - `src/components/ui/virtualgrid.tsx:149-156`, `189-205`
   - TanStack docs/examples position window-virtualized items by subtracting `scrollMargin`: `translateY(virtualItem.start - scrollMargin)`.

2. **Virtualized rows remount by design**. Stable child keys inside `renderItem` do not prevent remounts if the outer virtual wrapper leaves the virtual range.

3. **Row/card children perform request-like work on mount**:
   - `src/components/ui/user.tsx:45-53`: `useQuery(['profile', address], fetchAccount(address))`.
   - `src/components/domains/table/components/Price.tsx:43-51`: broker `fetchAccount`.
   - `src/components/domains/grid/components/card.tsx:90-98`: broker `fetchAccount`.
   - `src/components/ui/nameImage.tsx:30-51`: wrapped → unwrapped → local fallback image retry chain resets on remount.
   - `src/hooks/useWatchlist.ts:85-106`: authenticated watchlist checks.
   - `useCategories()` appears in several row/card components.

4. **Index virtual keys are fragile**:
   - `getItemKey: (index) => index` in list and grid means virtualizer identity follows position, not item identity.
   - This is safe only for strictly order-stable append-only data; less safe for loading placeholders, filtering, sorting, prepends, and deduping.

5. **ScrollTop Redux writes may amplify churn**:
   - Window virtualizer code writes scroll position to Redux after 100ms.
   - Filter state changes can rerender parent consumers and recreate inline `items={[...domains, ...]}` and `renderItem` closures during active scroll.

### Metis Review Adjustments
- First create network instrumentation to prove the dominant request source.
- Then fix the high-confidence `scrollMargin` positioning bug.
- Then reduce scroll Redux write frequency and add stable keys.
- Query/cache policy changes should be targeted; do not globally disable freshness.
- `NameImage` fallback cache should be added only if traces show image retry chains dominate.

---

## Work Objectives

### Core Objective
Stop the deep-scroll request storm while preserving public APIs, current sizing, scroll restoration, infinite loading, and visual output.

### Must Have
- Preserve `VirtualListProps` and `VirtualGridProps` public APIs.
- Preserve sizing math: List `count * (rowHeight + gap)`, Grid `totalRows * (cardHeight + gap)`.
- Preserve `containerPadding * 2` vs `* 1` Grid asymmetry.
- Preserve `renderItem(item, index, columnsCount)` for Grid.
- Preserve `useFlushSync: false`.
- Preserve Redux scroll restoration behavior but reduce unnecessary active-scroll churn.
- Add regression evidence showing deep scroll no longer produces repeated identical requests.

### Must NOT Have
- No broad consumer rewrites.
- No public prop additions unless absolutely unavoidable.
- No TanStack `gap` option.
- No `measureElement` or dynamic sizing work.
- No global React Query freshness shutdown.
- No suppression of useful marketplace/listing data refresh.

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — all verification is agent-executed.

### Required QA
- Use Playwright to navigate to affected route(s), warm/cache first visible data, scroll down at least 15 viewport pages, then scroll up/down repeatedly.
- Capture network requests by URL and type.
- Assert repeated identical stable lookup/image requests remain below threshold after warmup.
- Assert visible row count remains bounded.
- Assert infinite loading still fetches new pages when actually near the bottom.
- Assert `bun run typecheck`, `bun run lint`, and `bun run build` pass.

### Evidence Paths
- `.sisyphus/evidence/scroll-refetch/baseline-network.json`
- `.sisyphus/evidence/scroll-refetch/post-fix-network.json`
- `.sisyphus/evidence/scroll-refetch/deep-scroll-before.png`
- `.sisyphus/evidence/scroll-refetch/deep-scroll-after.png`

---

## Execution Strategy

```
Wave 1 — Prove the source
├── T1: Add deep-scroll network baseline spec [unspecified-high]
├── T2: Classify storming URLs by source component/query [deep]
└── T3: Add temporary diagnostic counters only inside e2e test harness [quick]

Wave 2 — Fix virtualization mechanics
├── T4: Correct window scrollMargin positioning in VirtualList [deep]
├── T5: Correct window scrollMargin positioning in VirtualGrid [deep]
└── T6: Add internal stable key resolver for virtual items [deep]

Wave 3 — Reduce remount/refetch amplification
├── T7: Harden User profile query cache policy [quick]
├── T8: Harden broker account query cache policy [quick]
├── T9: Harden watchlist/category stable lookup behavior [unspecified-high]
├── T10: Cache NameImage fallback decisions if confirmed by T1/T2 [unspecified-high]
└── T11: Throttle/idle Redux scrollTop persistence [deep]

Wave 4 — Regression and review
├── T12: Deep-scroll request-storm regression spec [unspecified-high]
├── T13: Verify visual/sizing/scroll restoration parity [unspecified-high]
├── T14: Build/lint/typecheck gate [quick]
└── T15: Final review + scope fidelity [oracle/deep]
```

---

## TODOs

- [x] 1. **Add deep-scroll network baseline spec**

  **What to do**:
  - Create a Playwright spec (e.g. `e2e/virtual-scroll-refetch.spec.ts`) that reproduces the user's scenario before applying fixes.
  - Navigate to the route where the user observed the storm (default: `/marketplace` list view; also test Grid if easy).
  - Attach `page.on('request')` and `page.on('response')` collectors.
  - Warm first page, scroll down 15+ viewport heights, then oscillate scroll up/down 5 times.
  - Group requests by URL family: profile/fetchAccount, brokerAccount, watchlist, categories, ENS metadata image, local OG image, pagination.
  - Save baseline to `.sisyphus/evidence/scroll-refetch/baseline-network.json`.

  **Acceptance Criteria**:
  - [ ] Spec reliably captures request counts.
  - [ ] Output names top 10 repeated URLs and counts.
  - [ ] Baseline confirms whether storm is query requests, image requests, or pagination.

  **QA Scenarios**:
  ```
  Scenario: Baseline request classification
    Tool: Playwright
    Steps:
      1. Open `/marketplace` in list mode at 1280x800.
      2. Wait for initial rows to load.
      3. Scroll down by 15 viewport heights.
      4. Oscillate scroll up/down 5 times.
      5. Save grouped network summary.
    Expected Result: JSON report exists with per-family request counts.
    Evidence: .sisyphus/evidence/scroll-refetch/baseline-network.json
  ```

- [x] 2. **Classify storming URLs by source component/query**

  **What to do**:
  - Map baseline URL families back to source files:
    - `fetchAccount` profile: `src/components/ui/user.tsx`.
    - broker: `Price.tsx` and `card.tsx`.
    - watchlist: `src/hooks/useWatchlist.ts`.
    - categories: `useCategories()`.
    - images: `NameImage` or EIK `Avatar`/header images.
    - pagination: `onScrollNearBottom` consumers.
  - Decide which Wave 3 tasks are mandatory vs optional.

  **Acceptance Criteria**:
  - [ ] A markdown table exists in `.sisyphus/evidence/scroll-refetch/source-classification.md`.
  - [ ] Each high-volume request family has a source file and fix owner.

- [x] 3. **Correct VirtualList window `scrollMargin` positioning**

  **What to do**:
  - In `VirtualListWindowInner`, change item positioning from raw `top: vi.start` to scroll-margin-correct positioning.
  - Recommended style:
    ```tsx
    top: 0,
    transform: `translateY(${vi.start - virtualizer.options.scrollMargin}px)`,
    ```
  - Leave `VirtualListContainerInner` unchanged (`top: vi.start`) because it has no window `scrollMargin`.
  - Preserve height, width, rowHeight, and sizing math.

  **Acceptance Criteria**:
  - [ ] Deep rows no longer jump/reposition incorrectly.
  - [ ] `virtualizer.getTotalSize()` unchanged.
  - [ ] `bun run typecheck` passes.

  **QA Scenarios**:
  ```
  Scenario: Deep list positioning stays stable
    Tool: Playwright
    Steps:
      1. Open `/marketplace` list mode.
      2. Capture first visible row index and bounding rect.
      3. Scroll down 15 viewport heights.
      4. Capture visible row rects.
      5. Scroll slightly up/down.
    Expected Result: Row positions change smoothly; no full-window jump/reload.
    Evidence: .sisyphus/evidence/scroll-refetch/list-positioning-after.json
  ```

- [x] 4. **Correct VirtualGrid window `scrollMargin` positioning**

  **What to do**:
  - In `VirtualGrid`, change virtual row/card top positioning to subtract `rowVirtualizer.options.scrollMargin`.
  - Preserve manual column left math and `containerPadding` asymmetry.

  **Acceptance Criteria**:
  - [ ] Grid totalHeight remains equal to existing baselines.
  - [ ] Card top positions are smooth during deep scroll.
  - [ ] `bun run typecheck` passes.

- [x] 5. **Add internal stable virtual item keys**

  **What to do**:
  - Add private helper in virtual components (or colocated utility) with no public API change:
    ```ts
    function getStableVirtualKey(item: unknown, index: number): React.Key {
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>
        return (record.token_id ?? record.id ?? record.address ?? record.name ?? index) as React.Key
      }
      return index
    }
    ```
  - For List: `getItemKey: (index) => getStableVirtualKey(items[index], index)`.
  - For Grid row virtualizer: row key can remain row index, but card wrapper should use stable item key.
  - Ensure null loading rows still use index fallback.

  **Acceptance Criteria**:
  - [ ] No public prop changes.
  - [ ] Stable IDs used when available.
  - [ ] TypeScript has no `as any`.

- [x] 6. **Throttle/idle Redux scrollTop persistence**

  **What to do**:
  - Replace active-scroll 100ms dispatch loop with a less aggressive strategy while preserving restoration:
    - Prefer `requestIdleCallback` with timeout fallback, or 300–500ms trailing debounce.
    - Dispatch only when rounded scrollTop changes meaningfully (e.g. ≥ 20px delta or final idle value).
  - Keep the old restore behavior: read `selectors.filters.scrollTop`, restore via `window.scrollTo`.

  **Acceptance Criteria**:
  - [ ] During continuous scroll, Redux `setScrollTop` dispatches are bounded.
  - [ ] Navigating away/back restores scroll within ±50px.

- [x] 7. **Harden stable row-level query cache policies**

  **What to do**:
  - Add explicit options to stable identity lookups:
    - `src/components/ui/user.tsx`: `staleTime`, `gcTime`, `refetchOnMount: false`, `refetchOnWindowFocus: false`, `enabled: !!address`.
    - `Price.tsx` broker query: same policy for `broker_address`.
    - `card.tsx` broker query: same policy.
  - Normalize address keys to lowercase where safe.
  - Do not change dynamic marketplace page queries.

  **Acceptance Criteria**:
  - [ ] Re-entering already-seen rows does not refetch profile/broker data within cache window.
  - [ ] User/profile UI still renders correctly.

- [x] 8. **Harden watchlist/category lookup behavior**

  **What to do**:
  - Inspect `useWatchlist.ts` and mutation invalidation paths.
  - If baseline shows watchlist storming, add `refetchOnMount: false` and a reasonable stale window while preserving mutation invalidation.
  - Ensure `useCategories()` is not called redundantly per row if it can be hoisted to parent or uses long stale/cache and `refetchOnMount: false`.

  **Acceptance Criteria**:
  - [ ] Authenticated marketplace table deep scroll does not repeatedly request watchlist checks for already-seen names.
  - [ ] Watchlist add/remove still updates correctly.

- [x] 9. **Cache `NameImage` fallback decisions if image requests dominate**

  **What to do**:
  - Only implement if T1/T2 shows image requests are a major source.
  - Add bounded module-level cache keyed by `name` or `nameHash/labelHash` storing the last successful source mode: `wrapped`, `unwrapped`, or `fallback`.
  - Initialize `imageSrc` from cache on remount.
  - Update cache on `onLoad`/`onError` transitions.

  **Acceptance Criteria**:
  - [ ] Known-failing wrapped/unwrapped images do not retry on every remount.
  - [ ] Fallback OG image still works.

- [x] 10. **Add final deep-scroll regression spec**

  **What to do**:
  - Extend baseline spec into a post-fix assertion.
  - Warm first pass, reset counters, scroll 15+ pages down and oscillate.
  - Assert repeated stable lookup request count stays below strict threshold.
  - Save `.sisyphus/evidence/scroll-refetch/post-fix-network.json`.

  **Acceptance Criteria**:
  - [ ] No repeated storm of identical profile/broker/watchlist/category/image requests.
  - [ ] Pagination still fires only when near real bottom and only while `hasNextPage && !isFetchingNextPage`.

- [x] 11. **Full verification and review**

  **What to do**:
  - Run `bun run typecheck`.
  - Run `bun run lint`.
  - Run `bun run build`.
  - Run deep-scroll regression spec.
  - Review diff for scope creep.

  **Acceptance Criteria**:
  - [ ] All commands pass.
  - [ ] No public API changes.
  - [ ] No consumer rewrites beyond targeted cache/memoization if selected.

---

## Success Criteria

### Verification Commands
```bash
bun run typecheck
bun run lint
bun run build
bun x playwright test e2e/virtual-scroll-refetch.spec.ts
```

### Final Checklist
- [ ] Deep-scroll network request count is bounded after warmup.
- [ ] No repeated identical `fetchAccount` storms.
- [ ] No repeated `NameImage` wrapped/unwrapped/fallback retry chains if those were confirmed.
- [ ] Grid and List sizing parity remains intact.
- [ ] Scroll restoration still works.
- [ ] Infinite loading still works.
