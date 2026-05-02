# Virtual list/grid selector audit

## /marketplace (List mode) — `src/components/domains/index.tsx:254`

- **Route**: `/marketplace`
- **Container**: `div[class*="h-full"][class*="rounded-sm"][class*="px-0"]` — wrapper around `VirtualList` (`src/components/domains/index.tsx:254-284`)
- **Visible row**: `a[class*="group"][class*="border-tertiary"][class*="h-[60px]"][class*="justify-between"][class*="transition"]` — `TableRow` root (`src/components/domains/table/components/TableRow.tsx:230-262`)
- **Loading skeleton**: `div[class*="px-md"][class*="border-tertiary"][class*="h-[60px]"][class*="border-b"]` — loading row wrapper (`src/components/domains/index.tsx:267-269`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualList` calls `onScrollNearBottom` when the remaining distance is below `scrollThreshold` (`src/components/ui/virtuallist.tsx:185-202`)
- **Notes**: window-scroll mode; row height is 60px.

## /marketplace (Grid mode) — `src/components/domains/index.tsx:225`

- **Route**: `/marketplace?view=grid`
- **Container**: `div[class*="h-full"][class*="rounded-sm"][class*="md:px-md"][class*="lg:px-lg"]` — wrapper around `VirtualGrid` (`src/components/domains/index.tsx:225-252`)
- **Visible card**: `a[class*="group"][class*="bg-secondary"][class*="rounded-sm"][class*="opacity-100"]` — `Card` root (`src/components/domains/grid/components/card.tsx:184-208`)
- **Loading skeleton**: `div[class*="bg-secondary"][class*="animate-pulse"][class*="rounded-lg"]` — `LoadingCard` root (`src/components/domains/grid/components/loadingCard.tsx:4-17`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualGrid` calls `onScrollNearBottom` when the viewport is within threshold of the grid bottom (`src/components/ui/virtualgrid.tsx:181-191`)
- **Notes**: absolute-positioned cards inside the virtual spacer.

## /offers — `src/components/offers/index.tsx:134`

- **Route**: `/offers`
- **Container**: `div[class*="h-full"][class*="rounded-sm"][class*="px-0"]` — wrapper around `VirtualList` (`src/components/offers/index.tsx:132-161`)
- **Visible row**: `div[class*="group"][class*="border-tertiary"][class*="h-[60px]"][class*="hover:bg-white/10"]` — `OfferRow` root (`src/components/offers/components/offerRow.tsx:31-43`)
- **Loading skeleton**: `div[class*="px-md"][class*="border-tertiary"][class*="h-[60px]"][class*="border-b"]` — loading row wrapper (`src/components/offers/index.tsx:145-150`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualList` calls `onScrollNearBottom` when the remaining distance is below `scrollThreshold` (`src/components/ui/virtuallist.tsx:185-202`)
- **Notes**: deduplicates `n_of_many` offers before virtualization.

## /activity — `src/components/activity/index.tsx:137`

- **Route**: `/activity`
- **Container**: `div[class*="h-full"][class*="rounded-sm"][class*="px-0"]` — wrapper around `VirtualList` (`src/components/activity/index.tsx:135-170`)
- **Visible row**: `div[class*="group"][class*="border-tertiary"][class*="h-[86px]"][class*="sm:h-[60px]"]` — `ActivityRow` root (`src/components/activity/components/activityRow.tsx:76-180`)
- **Loading skeleton**: `div[class*="px-md"][class*="border-tertiary"][class*="h-[86px]"][class*="sm:h-[60px]"]` — loading row wrapper (`src/components/activity/index.tsx:150-158`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualList` calls `onScrollNearBottom` when the remaining distance is below `scrollThreshold` (`src/components/ui/virtuallist.tsx:185-202`)
- **Notes**: supports `containerScroll`; when enabled, the same `VirtualList` root becomes the scroll container (`src/components/ui/virtuallist.tsx:275-291`).

## /leaderboard — `src/app/leaderboard/components/LeaderboardList.tsx:287`

- **Route**: `/leaderboard`
- **Container**: `div.w-full:has(> div[class*="sticky"])` — top-level wrapper around filters + list (`src/app/leaderboard/components/LeaderboardList.tsx:162-310`)
- **Visible row**: `a[href^="/profile/"], div[class*="border-tertiary"][class*="md:hidden"]` — desktop `LeaderboardRow` root plus the mobile collapsible row (`src/app/leaderboard/components/LeaderboardRow.tsx:49-152,174-340`)
- **Loading skeleton**: `div[class*="border-tertiary"][class*="h-[60px]"][class*="md:flex"], div[class*="border-tertiary"][class*="h-[60px]"][class*="md:hidden"]` — desktop + mobile loading rows (`src/app/leaderboard/components/LeaderboardList.tsx:31-99`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualList` calls `onScrollNearBottom` when the remaining distance is below `scrollThreshold` (`src/components/ui/virtuallist.tsx:185-202`)
- **Notes**: desktop and mobile rows are different DOM trees; the selector above covers both.

## /categories (all holders) — `src/app/categories/components/allHoldersPanel.tsx:69`

- **Route**: `/categories`
- **Container**: `div.w-full:has(> div[class*="sticky"])` — top-level wrapper around sticky header + list (`src/app/categories/components/allHoldersPanel.tsx:54-84`)
- **Visible row**: `a[href^="/profile/"]` — `AllHolderRow` root (`src/app/categories/components/allHolderRow.tsx:50-107`)
- **Loading skeleton**: `div[class*="border-tertiary"][class*="h-[60px]"][class*="items-center"][class*="px-4"]` — inline loading row (`src/app/categories/components/allHoldersPanel.tsx:14-21`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualList` calls `onScrollNearBottom` when the remaining distance is below `scrollThreshold` (`src/components/ui/virtuallist.tsx:185-202`)
- **Notes**: sticky header is always present; the row link is profile-driven.

## /categories/[category] holders — `src/app/categories/[category]/components/holders.tsx:73`

- **Route**: `/categories/:category`
- **Container**: `div.w-full:has(> div[class*="sticky"])` — top-level wrapper around sticky header + list (`src/app/categories/[category]/components/holders.tsx:58-87`)
- **Visible row**: `a[href^="/profile/"]` — `HolderRow` root (`src/app/categories/[category]/components/holderRow.tsx:48-105`)
- **Loading skeleton**: `div[class*="border-tertiary"][class*="h-[60px]"][class*="items-center"][class*="px-4"]` — inline loading row (`src/app/categories/[category]/components/holders.tsx:18-25`)
- **Near-bottom trigger**: scroll to the bottom; `VirtualList` calls `onScrollNearBottom` when the remaining distance is below `scrollThreshold` (`src/components/ui/virtuallist.tsx:185-202`)
- **Notes**: category is injected into row click behavior, but the DOM root stays the same.
