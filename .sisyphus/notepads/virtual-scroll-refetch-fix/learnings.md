 - Stable identity queries that remount in virtualized rows should opt out of mount/focus refetches.
 - Per-query cache overrides can be safely more aggressive than the global QueryClient defaults for profile/broker lookups.
 - `enabled: !!id` plus long `staleTime`/`gcTime` avoids refetch storms without changing query keys or fetch logic.

## 2026-05-02 - Redux scrollTop idle persistence
- `VirtualListWindowInner` and `VirtualGridComponent` keep scroll restoration in `useLayoutEffect` (`selectors.filters.scrollTop` -> `window.scrollTo`) separate from persistence.
- ScrollTop persistence can be throttled by scheduling Redux `setScrollTop` via `requestIdleCallback({ timeout: 500 })`, with `window.setTimeout(..., 300)` fallback for unsupported browsers.
- `bun run typecheck && bun run lint` passed after the idle persistence change.
