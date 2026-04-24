# Dashboard widget ideas (to discuss)

Captured while building the first round of new widgets. These weren't built in this PR because they need a design/product call before implementing, or they overlap with existing widgets.

## Overlaps with existing widgets — needs decision

### `category-activity-feed`
- **Pitch**: Activity feed filtered by category
- **Why not built**: the existing `ActivityWidget` already has a category filter, so this would be redundant unless we want a pre-pinned variant (e.g. "always filter to punks"). Decide: redundant, or valuable as a quick-add shortcut?

### `recent-premium-listings`
- **Pitch**: Premium-tier names sorted by watchers
- **Why not built**: `DomainsWidget` can already be filtered to `status: Premium` + sort by watchers. A dedicated widget would just ship pre-configured filters. Could be a useful "preset" concept but feels like a DomainsWidget preset feature, not a new widget type.

## User-centric widgets — need auth/permission discussion

### `offers-summary`
- **Pitch**: Counts of offers received vs sent (accepted / pending / rejected)
- **Why not built**: `useReceivedOffers` + `useSentOffers` exist but both require authenticated user context, and product may want different surfacing (e.g. embedded in portfolio widget vs standalone). Easy to build once we know what we want to highlight — just 4 numbers and a CTA.

### `notifications-feed`
- **Pitch**: In-dashboard notifications panel
- **Why not built**: notifications exist in the app but rendering them well in a widget (grouping, read/unread, mark-as-read) deserves UX thought rather than a quick reuse.

## Market/trend widgets — worth building but design-dependent

### `featured-names`
- **Pitch**: Hand-curated or algorithmically picked "names to watch today"
- **Why not built**: need a backend signal for "featured". Could be: highest watcher growth in 24h, top-viewed registered names, admin-picked. Needs product input.

### `category-registrations-chart`
- **Pitch**: Registration rate over time for a chosen category (the existing `registrations-chart` is market-wide)
- **Why not built**: category-level registration data is probably already in `CategoryType.reg_count_1mo/1w/1y` but we'd need a time-series endpoint for a proper chart, which doesn't exist yet. Scope: either add the endpoint or skip.

### `floor-price-tracker`
- **Pitch**: Floor price of one or more categories with delta vs 1d/1w/1mo
- **Why not built**: need historical floor data (not just the current snapshot exposed in `CategoryType.floor_price_wei`). Requires a backend endpoint for historical floor.

## Single-value "preset" widgets — low signal alone, could bundle

### `eth-price`
- **Pitch**: Current ETH/USD price
- **Why not built**: trivially provided by `useETHPrice` but a whole widget for one number feels thin. Could be part of a "Market" compound widget.

### `gas-tracker`
- **Pitch**: Current gas price
- **Why not built**: no existing gas endpoint in the app; would need wagmi/viem integration. Nice-to-have but out of current scope.

## Power-user widgets — need scoping

### `saved-searches`
- **Pitch**: List of user's saved `DomainsWidget` filter presets, one-click to restore
- **Why not built**: requires a "save preset" feature on the DomainsWidget first. Could be a nice follow-up once presets exist.

### `compare-categories`
- **Pitch**: Side-by-side comparison of 2–3 categories on the key metrics (floor, volume, holders)
- **Why not built**: uses the same data as `category-stats` — could be a `category-stats` variant that accepts multiple categories. Layout gets tight on narrow widget cells.

### `followed-activity`
- **Pitch**: Activity stream filtered to accounts the user follows (EFP list)
- **Why not built**: no existing backend filter for "activity involving addresses in my follow list". Needs an API change.
