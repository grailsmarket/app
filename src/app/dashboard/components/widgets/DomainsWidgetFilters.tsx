'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { updateDomainFilters } from '@/state/reducers/dashboard'
import type { MarketplaceFiltersState, MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'
import {
  MARKETPLACE_STATUS_FILTER_LABELS,
  MARKET_FILTER_LABELS,
  MARKET_FILTER_OPTIONS,
  MARKET_FILTER_OPTION_LABELS,
  MARKETPLACE_OPTIONS,
  MARKETPLACE_OPTION_LABELS,
  TEXT_MATCH_FILTER_LABELS,
  TEXT_NON_MATCH_FILTER_LABELS,
  type MarketFilterLabel,
  type MarketFilterOption,
  type MarketplaceOption,
  type TextMatchFilterLabel,
  type TextNonMatchFilterLabel,
} from '@/constants/filters/marketplaceFilters'
import FilterDropdown from '@/components/filters/components/FilterDropdown'
import FilterSelector from '@/components/filters/components/FilterSelector'
import ExpandableTab from '@/components/ui/expandableTab'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { localizeNumber } from '@/utils/localizeNumber'
import { cn } from '@/utils/tailwind'
import arrowDown from 'public/icons/arrow-down.svg'
import type { CategoryType } from '@/types/domains'

const STATUS_OPTIONS = ['none', ...MARKETPLACE_STATUS_FILTER_LABELS] as const
const STATUS_OPTION_LABELS: Record<string, string> = {
  none: '---',
  ...Object.fromEntries(MARKETPLACE_STATUS_FILTER_LABELS.map((s) => [s, s])),
}

interface DomainsWidgetFiltersProps {
  instanceId: string
  filters: MarketplaceFiltersState
}

const inputClassName = 'border-primary/20 p-md w-full rounded-sm border-2 text-sm outline-none'

// ── Section wrapper ─────────────────────────────────────────────
const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className='border-tertiary border-b'>{children}</div>
)

// ── Category row (self-contained, no useFilterRouter) ───────────
const DashboardCategoryRow: React.FC<{
  name: string
  displayName: string
  count: number
  isActive: boolean
  onToggle: () => void
}> = ({ displayName, count, isActive, onToggle }) => (
  <div className='p-lg hover:bg-secondary w-full cursor-pointer rounded-sm' onClick={onToggle}>
    <div className='flex items-center justify-between'>
      <p className='text-lg leading-[18px] font-medium capitalize'>{displayName}</p>
      <div className='flex items-center gap-x-2'>
        <p className='text-neutral text-xs leading-[18px] font-medium'>{localizeNumber(count)}</p>
        <FilterSelector onClick={onToggle} isActive={isActive} />
      </div>
    </div>
  </div>
)

// ── Main component ──────────────────────────────────────────────
const DomainsWidgetFilters: React.FC<DomainsWidgetFiltersProps> = ({ instanceId, filters }) => {
  const dispatch = useAppDispatch()
  const [showCategories, setShowCategories] = useState(false)
  const { categories, categoriesLoading } = useCategories()

  const update = useCallback(
    (patch: Partial<MarketplaceFiltersState>) => {
      dispatch(updateDomainFilters({ id: instanceId, filters: patch }))
    },
    [dispatch, instanceId]
  )

  // Market filter
  const setMarketOption = useCallback(
    (label: MarketFilterLabel, value: MarketFilterOption) => {
      update({ market: { ...filters.market, [label]: value } })
    },
    [filters.market, update]
  )

  const setMarketplace = useCallback(
    (value: MarketplaceOption) => {
      update({ market: { ...filters.market, marketplace: value } })
    },
    [filters.market, update]
  )

  // Length filter
  const setLength = useCallback(
    (field: 'min' | 'max', value: string) => {
      const num = value === '' ? null : Math.max(0, Math.floor(Number(value)))
      update({ length: { ...filters.length, [field]: isNaN(num as number) ? null : num } })
    },
    [filters.length, update]
  )

  // Price range
  const setPrice = useCallback(
    (field: 'min' | 'max', value: string) => {
      const num = value === '' ? null : parseFloat(value)
      update({ priceRange: { ...filters.priceRange, [field]: isNaN(num as number) ? null : num } })
    },
    [filters.priceRange, update]
  )

  // Offer range
  const setOffer = useCallback(
    (field: 'min' | 'max', value: string) => {
      const num = value === '' ? null : parseFloat(value)
      update({ offerRange: { ...filters.offerRange, [field]: isNaN(num as number) ? null : num } })
    },
    [filters.offerRange, update]
  )

  // Text match
  const setTextMatch = useCallback(
    (label: TextMatchFilterLabel, value: string) => {
      update({ textMatch: { ...filters.textMatch, [label]: value } })
    },
    [filters.textMatch, update]
  )

  // Text non-match
  const setTextNonMatch = useCallback(
    (label: TextNonMatchFilterLabel, value: string) => {
      update({ textNonMatch: { ...filters.textNonMatch, [label]: value } })
    },
    [filters.textNonMatch, update]
  )

  // Category helpers
  const selectedCategories = filters.categories
  const allCategoryNames = useMemo(() => categories?.map((c) => c.name) ?? [], [categories])
  const areAllSelected = allCategoryNames.length > 0 && allCategoryNames.every((c) => selectedCategories.includes(c))

  const toggleCategory = useCallback(
    (name: string) => {
      const next = selectedCategories.includes(name)
        ? selectedCategories.filter((c) => c !== name)
        : [...selectedCategories, name]
      update({ categories: next })
    },
    [selectedCategories, update]
  )

  const toggleAll = useCallback(() => {
    if (areAllSelected) {
      update({ categories: [] })
    } else {
      update({ categories: allCategoryNames })
    }
  }, [areAllSelected, allCategoryNames, update])

  // Group categories by classification (same pattern as existing Filters)
  const classifiedCategories = useMemo(() => {
    if (!categories) return []
    const map = new Map<string, CategoryType[]>()
    const uncategorized: CategoryType[] = []

    categories.forEach((cat) => {
      if (!cat.classifications || cat.classifications.length === 0) {
        uncategorized.push(cat)
        return
      }
      cat.classifications.forEach((cls) => {
        map.set(cls, [...(map.get(cls) ?? []), cat])
      })
    })

    const result = Array.from(map.entries()).map(([classification, cats]) => ({ classification, categories: cats }))
    if (uncategorized.length > 0) {
      result.push({ classification: 'Other', categories: uncategorized })
    }
    return result
  }, [categories])

  // Summary text for the categories tab
  const categorySummary = useMemo(() => {
    if (selectedCategories.length === 0) return null
    if (selectedCategories.length === allCategoryNames.length) return 'All'
    const firstName = categories?.find((c) => c.name === selectedCategories[0])?.display_name ?? selectedCategories[0]
    return selectedCategories.length > 1 ? `${firstName} +${selectedCategories.length - 1}` : firstName
  }, [selectedCategories, allCategoryNames.length, categories])

  return (
    <div className='border-tertiary flex h-full overflow-hidden border-r'>
      {/* ── Panel 1: Main filters ──────────────────────────── */}
      <div
        className={cn(
          'flex min-w-full flex-col overflow-y-auto pb-8 transition-transform',
          showCategories && '-translate-x-full'
        )}
      >
        {/* Categories tab (opens panel 2) */}
        <Section>
          <div
            className='p-lg hover:bg-secondary w-full cursor-pointer rounded-sm'
            onClick={() => setShowCategories(true)}
          >
            <div className='flex items-center justify-between'>
              <p className='text-lg leading-[18px] font-medium'>Categories</p>
              <div className='flex items-center gap-x-2'>
                <p className='text-neutral text-md font-medium'>{categorySummary}</p>
                <Image src={arrowDown} alt='open' className='-rotate-90 transition-all' />
              </div>
            </div>
          </div>
        </Section>

        {/* Status */}
        <Section>
          <FilterDropdown<string>
            label='Status'
            value={filters.status[0] ?? 'none'}
            options={STATUS_OPTIONS}
            optionLabels={STATUS_OPTION_LABELS}
            onChange={(value) => update({ status: value === 'none' ? [] : [value as MarketplaceStatusFilterType] })}
            noneValue='none'
          />
        </Section>

        {/* Market */}
        <Section>
          <div className='flex flex-col'>
            {MARKET_FILTER_LABELS.map((label) => (
              <FilterDropdown<MarketFilterOption>
                key={label}
                label={label}
                value={filters.market[label]}
                options={MARKET_FILTER_OPTIONS}
                optionLabels={MARKET_FILTER_OPTION_LABELS}
                onChange={(value) => setMarketOption(label, value)}
                noneValue='none'
              />
            ))}
            <FilterDropdown<MarketplaceOption>
              label='Marketplace'
              value={filters.market.marketplace}
              options={MARKETPLACE_OPTIONS}
              optionLabels={MARKETPLACE_OPTION_LABELS}
              onChange={setMarketplace}
              noneValue='none'
            />
          </div>
        </Section>

        {/* Text Match */}
        <Section>
          <div className='p-lg flex flex-col gap-3'>
            <p className='text-lg font-medium'>Text Match</p>
            {TEXT_MATCH_FILTER_LABELS.map((label) => (
              <div key={label} className='flex flex-col gap-1'>
                <span className='text-sm font-medium'>{label}</span>
                <input
                  type='text'
                  placeholder={label}
                  value={filters.textMatch[label]}
                  onChange={(e) => setTextMatch(label, e.target.value)}
                  className={inputClassName}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Text Non-Match */}
        <Section>
          <div className='p-lg flex flex-col gap-3'>
            <p className='text-lg font-medium'>Text Exclude</p>
            {TEXT_NON_MATCH_FILTER_LABELS.map((label) => (
              <div key={label} className='flex flex-col gap-1'>
                <span className='text-sm font-medium'>{label}</span>
                <input
                  type='text'
                  placeholder={label}
                  value={filters.textNonMatch[label]}
                  onChange={(e) => setTextNonMatch(label, e.target.value)}
                  className={inputClassName}
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Length */}
        <Section>
          <div className='p-lg flex flex-col gap-1'>
            <p className='text-lg font-medium'>Length</p>
            <div className='flex items-center gap-2'>
              <input
                type='number'
                min={0}
                placeholder='Min'
                value={filters.length.min ?? ''}
                onChange={(e) => setLength('min', e.target.value)}
                className={inputClassName}
              />
              <span className='text-neutral text-sm'>–</span>
              <input
                type='number'
                min={0}
                placeholder='Max'
                value={filters.length.max ?? ''}
                onChange={(e) => setLength('max', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </Section>

        {/* Price Range */}
        <Section>
          <div className='p-lg flex flex-col gap-1'>
            <p className='text-lg font-medium'>Price (ETH)</p>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                inputMode='decimal'
                placeholder='Min'
                value={filters.priceRange.min ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setPrice('min', val)
                }}
                className={inputClassName}
              />
              <span className='text-neutral text-sm'>–</span>
              <input
                type='text'
                inputMode='decimal'
                placeholder='Max'
                value={filters.priceRange.max ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setPrice('max', val)
                }}
                className={inputClassName}
              />
            </div>
          </div>
        </Section>

        {/* Offer Range */}
        <Section>
          <div className='p-lg flex flex-col gap-1'>
            <p className='text-lg font-medium'>Offer (ETH)</p>
            <div className='flex items-center gap-2'>
              <input
                type='text'
                inputMode='decimal'
                placeholder='Min'
                value={filters.offerRange.min ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setOffer('min', val)
                }}
                className={inputClassName}
              />
              <span className='text-neutral text-sm'>–</span>
              <input
                type='text'
                inputMode='decimal'
                placeholder='Max'
                value={filters.offerRange.max ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setOffer('max', val)
                }}
                className={inputClassName}
              />
            </div>
          </div>
        </Section>
      </div>

      {/* ── Panel 2: Categories (slides in from right) ─────── */}
      <div
        className={cn(
          'flex min-w-full flex-col overflow-y-auto pb-8 transition-transform',
          showCategories && '-translate-x-full'
        )}
      >
        {/* Back button */}
        <div
          className='p-lg hover:bg-secondary border-tertiary flex w-full cursor-pointer items-center gap-2 border-b'
          onClick={() => setShowCategories(false)}
        >
          <Image src={arrowDown} alt='back' className='rotate-90 transition-all' />
          <p className='text-lg font-medium'>Categories</p>
        </div>

        {/* All toggle */}
        <div className='p-lg hover:bg-secondary border-tertiary w-full cursor-pointer border-b' onClick={toggleAll}>
          <div className='flex items-center justify-between'>
            <p className='text-lg font-medium'>All</p>
            <div className='flex items-center gap-x-2'>
              <p className='text-neutral text-xs font-medium'>
                {localizeNumber(categories?.reduce((sum, c) => sum + c.member_count, 0) ?? 0)}
              </p>
              <FilterSelector onClick={toggleAll} isActive={areAllSelected} />
            </div>
          </div>
        </div>

        {/* Categories grouped by classification */}
        {categoriesLoading ? (
          <div className='flex items-center justify-center py-8'>
            <div className='border-primary h-5 w-5 animate-spin rounded-full border-b-2' />
          </div>
        ) : classifiedCategories.length === 0 ? (
          <div className='text-neutral px-4 py-8 text-center text-sm'>No categories found</div>
        ) : (
          classifiedCategories.map(({ classification, categories: cats }) => (
            <CategoryClassificationGroup
              key={classification}
              classification={classification}
              categories={cats}
              selectedCategories={selectedCategories}
              onToggle={toggleCategory}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Classification group with expandable tab ────────────────────
const CategoryClassificationGroup: React.FC<{
  classification: string
  categories: CategoryType[]
  selectedCategories: string[]
  onToggle: (name: string) => void
}> = ({ classification, categories, selectedCategories, onToggle }) => {
  const [open, setOpen] = useState(false)
  const sorted = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name)), [categories])
  const totalCount = categories.reduce((sum, c) => sum + c.member_count, 0)
  const expandedHeight = 64 + sorted.length * 52

  return (
    <ExpandableTab
      label={classification}
      open={open}
      toggleOpen={() => setOpen(!open)}
      headerHeight={56}
      expandedHeight={expandedHeight}
      showHeader
      CustomComponent={<p className='text-md font-medium'>{localizeNumber(totalCount)}</p>}
    >
      {sorted.map((cat) => (
        <DashboardCategoryRow
          key={cat.name}
          name={cat.name}
          displayName={cat.display_name}
          count={cat.member_count}
          isActive={selectedCategories.includes(cat.name)}
          onToggle={() => onToggle(cat.name)}
        />
      ))}
    </ExpandableTab>
  )
}

export default DomainsWidgetFilters
