import StatusFilter from '../StatusFilter'
import MarketFilter from '../MarketFilter'
import LengthFilter from '../LengthFilter'
import CategoryFilter from '../CategoryFilter'
import CategoryFilterAll from '../CategoryFilterButtons/CategoryFilterAll'
import PriceRangeFilter from '../PriceRangeFilter'
import OfferFilter from '../OfferFilter'
import WatchersFilter from '../WatchersFilter'
import ViewsFilter from '../ViewsFilter'
import CategoriesCountFilter from '../CategoriesCountFilter'
import CategoryFilterTab from '../CategoryFilterTab'
import { useFilterContext } from '@/context/filters'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { cn } from '@/utils/tailwind'
import { Cross, useIsClient } from 'ethereum-identity-kit'
import { useCategories } from '../../hooks/useCategories'
import TypeFilter from '../TypeFilter'
import TextMatchFilter from '../TextMatchFilter'
import TextNonMatchFilter from '../TextNonMatchFilter'
import { CategoryType } from '@/types/domains'
import ExpandableTab from '@/components/ui/expandableTab'
import { useEffect, useMemo, useRef, useState } from 'react'
import FilterSelector from '../FilterSelector'
import { useAppDispatch } from '@/state/hooks'
import CategoryFilterNone from '../CategoryFilterButtons/CategoryFilterNone'
import { localizeNumber } from '@/utils/localizeNumber'
import SortDropdown from '@/components/domains/sortDropdown'
import Image from 'next/image'
import MagnifyingGlass from 'public/icons/search.svg'

interface FiltersProps {
  isPanelCategories: boolean
  setPanelCategories: () => void
}

const Filters: React.FC<FiltersProps> = ({ isPanelCategories, setPanelCategories }) => {
  const { filterType, profileTab, categoryTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'
  const activeCategoryTab = categoryTab?.value || 'names'
  const isClient = useIsClient()
  const { categories, userCategoryCounts } = useCategories()
  // Get marketplace and categoriesPage tabs from filter router
  const { marketplaceTab, categoriesPageTab, selectors, actions } = useFilterRouter()
  const activeMarketplaceTab = marketplaceTab?.value || 'names'
  const activeCategoriesPageTab = categoriesPageTab?.value || 'categories'
  const dispatch = useAppDispatch()

  const classifiedCategories = useMemo(() => {
    const hashMap = new Map<string, CategoryType[]>()

    categories?.forEach((category) => {
      category.classifications.forEach((classification) => {
        hashMap.set(classification, [...(hashMap.get(classification) || []), category])
      })
    })

    return hashMap
  }, [categories])

  const categoriesToDisplay = Array.from(classifiedCategories.entries()).map(([key, value]) => {
    return {
      classification: key,
      categories: value,
    }
  })

  // Local state for search input to prevent glitchy typing
  const [localSearch, setLocalSearch] = useState(selectors.filters.search || '')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const userHasTyped = useRef(false)

  // Sync local state from Redux only on initial page load
  // Once user starts typing, local state becomes the source of truth
  useEffect(() => {
    if (!userHasTyped.current) {
      setLocalSearch(selectors.filters.search || '')
    }
  }, [selectors.filters.search])

  // Debounced search handler - only updates Redux, useFilterUrlSync handles URL
  const handleSearchChange = (value: string) => {
    userHasTyped.current = true
    setLocalSearch(value)

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the Redux update (URL is handled by useFilterUrlSync)
    debounceRef.current = setTimeout(() => {
      dispatch(actions.setSearch(value))
    }, 300)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  if (!isClient) return null

  const showUserCategoryCounts =
    filterType === 'profile' &&
    (activeProfileTab === 'domains' || activeProfileTab === 'grace' || activeProfileTab === 'listings') &&
    !!userCategoryCounts

  // Use appropriate categories based on filter context
  const showCategoryTab =
    filterType === 'marketplace' ||
    filterType === 'categoriesPage' ||
    activeProfileTab === 'domains' ||
    activeProfileTab === 'watchlist' ||
    activeProfileTab === 'listings' ||
    activeProfileTab === 'grace' ||
    activeProfileTab === 'expired'

  // Hide status filter for category/marketplace/categoriesPage Premium and Available tabs, and profile Grace tab (status is locked for these tabs)
  const showStatusFilter = !(
    (filterType === 'category' && (activeCategoryTab === 'premium' || activeCategoryTab === 'available')) ||
    (filterType === 'marketplace' && (activeMarketplaceTab === 'premium' || activeMarketplaceTab === 'available')) ||
    (filterType === 'categoriesPage' &&
      (activeCategoriesPageTab === 'premium' || activeCategoriesPageTab === 'available')) ||
    (filterType === 'profile' && activeProfileTab === 'grace')
  )

  // Show offer filter for marketplace/categoriesPage/category "Names" tabs and profile domains/grace/watchlist/listings tabs
  const showOfferFilter =
    (filterType === 'marketplace' && (activeMarketplaceTab === 'names' || activeMarketplaceTab === 'listings')) ||
    (filterType === 'categoriesPage' && activeCategoriesPageTab === 'names') ||
    (filterType === 'category' && activeCategoryTab === 'names') ||
    (filterType === 'profile' &&
      (activeProfileTab === 'domains' ||
        activeProfileTab === 'grace' ||
        activeProfileTab === 'watchlist' ||
        activeProfileTab === 'listings'))

  return (
    <div className='flex min-h-0 flex-1 overflow-x-hidden'>
      <div
        className={cn(
          'flex min-h-0 min-w-full flex-col overflow-y-auto transition-transform lg:min-w-[292px]',
          showCategoryTab && isPanelCategories && '-translate-x-[100%] lg:-translate-x-[292px]'
        )}
      >
        <div className='flex flex-col'>
          <div className='px-lg mb-2 flex w-full flex-col gap-2'>
            <div className='group border-tertiary flex h-9 w-full items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:h-10'>
              <input
                type='text'
                placeholder='Search'
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className='w-full bg-transparent text-lg outline-none'
              />
              {localSearch.length > 0 ? (
                <Cross
                  onClick={() => {
                    setLocalSearch('')
                    handleSearchChange('')
                  }}
                  className='h-4 w-4 cursor-pointer p-0.5 opacity-100 transition-opacity hover:opacity-70'
                />
              ) : (
                <Image
                  src={MagnifyingGlass}
                  alt='Search'
                  width={16}
                  height={16}
                  className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
                />
              )}
            </div>
            <SortDropdown />
          </div>
          {/* <SortFilter /> */}
          {showCategoryTab && <CategoryFilterTab setPanelCategories={setPanelCategories} />}
          {showStatusFilter && <StatusFilter />}
          <MarketFilter />
          <TextMatchFilter />
          <TextNonMatchFilter />
          <LengthFilter />
          <PriceRangeFilter />
          {showOfferFilter && <OfferFilter />}
          <WatchersFilter />
          <ViewsFilter />
          <CategoriesCountFilter />
          <TypeFilter />
        </div>
      </div>
      {showCategoryTab && (
        <div
          className={cn(
            'pb-lg flex min-h-0 min-w-full flex-col overflow-y-auto transition-transform lg:min-w-[292px]',
            isPanelCategories && '-translate-x-[100%] lg:-translate-x-[292px]'
          )}
        >
          <CategoryFilterNone showUserCategoryCounts={showUserCategoryCounts} />
          <CategoryFilterAll
            allCategoryNames={categories?.map((c) => c.name) || []}
            totalCount={
              showUserCategoryCounts
                ? userCategoryCounts.any
                : categories?.reduce((sum, c) => sum + c.member_count, 0) || 0
            }
          />
          {categoriesToDisplay.map((category) => {
            const categoriesWithUserCount = showUserCategoryCounts
              ? category.categories.map((c) => ({ ...c, member_count: userCategoryCounts[c.name] }))
              : category.categories
            return (
              <CategoryExpandableTab
                key={category.classification}
                classification={category.classification}
                value={categoriesWithUserCount}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

interface CategoryExpandableTabProps {
  classification: string
  value: CategoryType[]
}

const CategoryExpandableTab: React.FC<CategoryExpandableTabProps> = ({ classification, value }) => {
  const [open, setOpen] = useState(false)
  const dispatch = useAppDispatch()
  const { actions, selectors } = useFilterRouter()
  const expandedHeight = 64 + value.length * 52
  const sortedValue = value.sort((a, b) => a.name.localeCompare(b.name))
  const totalCount = value.reduce((sum, category) => sum + category.member_count, 0)
  const areCategoriesSelected = value.every((category) => selectors.filters.categories?.includes(category.name))

  return (
    <ExpandableTab
      label={classification}
      open={open}
      toggleOpen={() => setOpen(!open)}
      headerHeight={56}
      expandedHeight={expandedHeight}
      showHeader={true}
      CustomComponent={
        <div className='flex items-center gap-2'>
          <p className='text-md font-medium'>{localizeNumber(totalCount)}</p>
          <FilterSelector
            onClick={() =>
              areCategoriesSelected
                ? dispatch(actions.removeCategories(value.map((category) => category.name)))
                : dispatch(actions.addCategories(value.map((category) => category.name)))
            }
            isActive={areCategoriesSelected}
          />
        </div>
      }
    >
      {sortedValue.map((category) => {
        return <CategoryFilter key={category.name} category={category.name} owner_count={category.member_count} />
      })}
    </ExpandableTab>
  )
}

export default Filters
