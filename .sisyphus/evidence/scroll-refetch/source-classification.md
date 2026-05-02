# Deep-Scroll Request Storm — Source Classification

> Baseline network capture returned 0 requests (no live backend in CI environment).
> Classification is based on static code analysis performed during investigation phase.

## URL Family → Source File Mapping

| URL Family | Source File(s) | Query Key | Trigger | Fix Applied |
|---|---|---|---|---|
| `profile/fetchAccount` | `src/components/ui/user.tsx:45-53` | `['profile', address]` | Every virtual row remount that renders `<User>` | ✅ `refetchOnMount: false`, `staleTime: 30min` added |
| `brokerAccount` | `src/components/domains/table/components/Price.tsx:43-51` | `['brokerAccount', broker_address]` | Domain table rows with brokered listings | ✅ `refetchOnMount: false`, `staleTime: 30min` added |
| `brokerAccount` | `src/components/domains/grid/components/card.tsx:90-98` | `['brokerAccount', broker_address]` | Grid cards with brokered listings | ✅ `refetchOnMount: false`, `staleTime: 30min` added |
| `watchlist` | `src/hooks/useWatchlist.ts:85-106` | `['isWatchlisted', name, userAddress, ...]` | Authenticated marketplace table rows | ⚠️ Not fixed (conditional on baseline confirming storm) |
| `categories` | `src/components/filters/hooks/useCategories.ts` | `['categories']` | Multiple row/card components | ⚠️ Not fixed (shared query, likely cached by React Query) |
| `ens-metadata-image` | `src/components/ui/nameImage.tsx:30-51` | N/A (image element) | Every domain/offer/activity row remount | ⚠️ Not fixed (browser cache should handle; no baseline confirmation) |
| `local-og-image` | `src/components/ui/nameImage.tsx:33` | N/A (fallback image) | After wrapped+unwrapped ENS image fail | ⚠️ Not fixed (fallback only, rare) |
| `marketplace-data` | Pagination hooks in consumers | Infinite query keys | `onScrollNearBottom` callback | ✅ Guarded by `hasNextPage && !isFetchingNextPage` in all consumers |
| `eth-price` | `src/hooks/useETHPrice.ts:6-10` | `['ethPrice']` | Shared across all domain rows | ✅ Shared key — React Query deduplicates |

## Wave 3 Task Decisions

| Task | Decision | Rationale |
|---|---|---|
| T7: User/broker query cache | ✅ DONE | High-confidence: `fetchAccount` per row, no `refetchOnMount: false` |
| T8: Watchlist/category | ⚠️ DEFERRED | Watchlist only fires for authenticated users; categories use shared key. Revisit if storm persists after T3/T7 fixes. |
| T9: NameImage fallback cache | ⚠️ DEFERRED | Browser cache handles most cases; no baseline confirmation of storm. Revisit if image requests dominate in live testing. |

## Primary Root Causes Fixed

1. **`scrollMargin` positioning bug** (T3, T4) — items were placed at wrong absolute positions, causing excessive range churn and remounts at deep scroll positions.
2. **Profile/broker `fetchAccount` on every remount** (T7) — `refetchOnMount: false` + 30min stale time prevents refetch when rows re-enter the virtual window.
3. **Redux scrollTop writes during active scroll** (T6) — `requestIdleCallback` throttles dispatch frequency.
4. **Index-based virtual keys** (T5) — stable IDs prevent identity slot churn during list mutations.

## Remaining Risk

- **Watchlist checks** (`src/hooks/useWatchlist.ts:85-106`): enabled only for authenticated users. If the storm persists in production for logged-in users, add `refetchOnMount: false` and a stale window to this query while preserving mutation invalidation.
- **NameImage retry chain**: each remount resets `imageSrc` state, potentially retrying wrapped→unwrapped→fallback. If image requests dominate in live network traces, add a module-level `Map<string, 'wrapped'|'unwrapped'|'fallback'>` cache keyed by name.
