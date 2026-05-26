'use client'

import React, { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { clearDomainFilters, updateDomainFilters } from '@/state/reducers/dashboard'
import { Cross } from 'ethereum-identity-kit'
import FilterDropdown from '@/components/filters/components/FilterDropdown'
import FilterSelector from '@/components/filters/components/FilterSelector'
import ExpandableTab from '@/components/ui/expandableTab'
import DatePicker from '@/components/ui/datepicker'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { localizeNumber } from '@/utils/localizeNumber'
import { cn } from '@/utils/tailwind'
import arrowDown from 'public/icons/arrow-down.svg'
import type { CategoryType } from '@/types/domains'
import filter from 'public/icons/filter.svg'
import {
  MarketFilterLabel,
  MarketFilterOption,
  MarketplaceOption,
  NameFilters,
  StatusType,
  TextMatchFilterLabel,
  TextNonMatchFilterLabel,
  TypeFilterLabel,
} from '@/types/filters/name'
import {
  MARKET_FILTER_LABELS,
  MARKET_FILTER_OPTION_LABELS,
  MARKET_FILTER_OPTIONS,
  MARKETPLACE_OPTION_LABELS,
  MARKETPLACE_OPTIONS,
  MARKETPLACE_TYPE_FILTER_LABELS,
  NAME_STATUS_FILTER_LABELS,
  TEXT_MATCH_FILTER_LABELS,
  TEXT_NON_MATCH_FILTER_LABELS,
  TYPE_FILTER_OPTION_LABELS,
  TYPE_FILTER_OPTIONS,
} from '@/constants/filters/name'
import { TypeFilterOption } from '@/types/filters/name'

const STATUS_OPTIONS = ['none', ...NAME_STATUS_FILTER_LABELS] as const
const STATUS_OPTION_LABELS: Record<string, string> = {
  none: '---',
  ...Object.fromEntries(NAME_STATUS_FILTER_LABELS.map((s) => [s, s])),
}

interface DomainsWidgetFiltersProps {
  instanceId: string
  filters: NameFilters
}

const inputClassName = 'border-primary/20 p-md w-1/2 rounded-sm border-2 text-md outline-none'

const Section: React.FC<{ children: React.ReactNode; isLast?: boolean }> = ({ children, isLast = false }) => (
  <div className={cn('border-tertiary border-b', isLast && 'border-b-0')}>{children}</div>
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
    (patch: Partial<NameFilters>) => {
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

  // Watchers count
  const setWatchers = useCallback(
    (field: 'min' | 'max', value: string) => {
      const num = value === '' ? null : Math.max(0, Math.floor(Number(value)))
      update({ watchersCount: { ...filters.watchersCount, [field]: isNaN(num as number) ? null : num } })
    },
    [filters.watchersCount, update]
  )

  // View count
  const setViews = useCallback(
    (field: 'min' | 'max', value: string) => {
      const num = value === '' ? null : Math.max(0, Math.floor(Number(value)))
      update({ viewCount: { ...filters.viewCount, [field]: isNaN(num as number) ? null : num } })
    },
    [filters.viewCount, update]
  )

  // Categories count (clubs)
  const setClubsCount = useCallback(
    (field: 'min' | 'max', value: string) => {
      const num = value === '' ? null : Math.max(0, Math.floor(Number(value)))
      update({ clubsCount: { ...filters.clubsCount, [field]: isNaN(num as number) ? null : num } })
    },
    [filters.clubsCount, update]
  )

  // Creation date
  const [showFromPicker, setShowFromPicker] = useState(false)
  const [showToPicker, setShowToPicker] = useState(false)

  const handleFromDateSelect = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      update({ creationDate: { ...filters.creationDate, min: `${yyyy}-${mm}-${dd}` } })
      setShowFromPicker(false)
    },
    [filters.creationDate, update]
  )

  const handleToDateSelect = useCallback(
    (timestamp: number) => {
      const date = new Date(timestamp * 1000)
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      update({ creationDate: { ...filters.creationDate, max: `${yyyy}-${mm}-${dd}` } })
      setShowToPicker(false)
    },
    [filters.creationDate, update]
  )

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return null
    const [y, m, d] = dateStr.split('-')
    return `${m}/${d}/${y}`
  }

  const minDateObj = filters.creationDate.min ? new Date(filters.creationDate.min + 'T00:00:00') : undefined
  const maxDateObj = filters.creationDate.max ? new Date(filters.creationDate.max + 'T00:00:00') : undefined

  // Type filter
  const setTypeOption = useCallback(
    (label: TypeFilterLabel, value: TypeFilterOption) => {
      update({ type: { ...filters.type, [label]: value } })
    },
    [filters.type, update]
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
      <div
        className={cn(
          'flex min-w-full flex-col overflow-y-auto pb-2 transition-transform',
          showCategories && '-translate-x-full'
        )}
      >
        <div className='p-lg pb-md flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Image src={filter} alt='filter' width={16} height={16} />
            <h4 className='text-lg font-medium'>Filters</h4>
          </div>
          {/* <button className='hover:opacity-70 flex cursor-pointer items-center justify-center gap-1 text-lg font-medium transition-opacity' onClick={() => {
            dispatch(setDomainFiltersOpen({ id: instanceId, open: false }))
          }}>
            <Image src={close} alt='close' width={16} height={16} />
          </button> */}
          <button
            className='px-lg bg-secondary flex h-10 cursor-pointer items-center justify-center gap-1 rounded-sm text-lg font-medium transition-opacity hover:opacity-70'
            onClick={() => {
              dispatch(clearDomainFilters(instanceId))
            }}
          >
            Clear
          </button>
        </div>
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
        <Section>
          <FilterDropdown<string>
            label='Status'
            value={filters.status[0] ?? 'none'}
            options={STATUS_OPTIONS}
            optionLabels={STATUS_OPTION_LABELS}
            onChange={(value) => update({ status: value === 'none' ? [] : [value as StatusType] })}
            noneValue='none'
          />
        </Section>
        <Section>
          <div className='flex flex-col'>
            {MARKET_FILTER_LABELS.map((label) => (
              <FilterDropdown<MarketFilterOption>
                key={label}
                label={label}
                value={filters.market[label]}
                options={MARKET_FILTER_OPTIONS}
                optionLabels={MARKET_FILTER_OPTION_LABELS}
                onChange={(value) => setMarketOption(label as MarketFilterLabel, value)}
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
        <Section>
          <div className='p-lg flex flex-col gap-3'>
            {TEXT_MATCH_FILTER_LABELS.map((label) => (
              <div key={label} className='flex flex-row items-center justify-between gap-1'>
                <span className='text-lg font-medium'>{label}</span>
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
        <Section>
          <div className='p-lg flex flex-col gap-3'>
            {TEXT_NON_MATCH_FILTER_LABELS.map((label) => (
              <div key={label} className='flex flex-row items-center justify-between gap-1'>
                <span className='text-[13px] font-medium'>{label}</span>
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
        <Section>
          <div className='p-lg flex items-center justify-between gap-2'>
            <p className='text-lg font-medium'>Length</p>
            <div className='flex w-2/3 items-center gap-2'>
              <input
                type='number'
                min={0}
                placeholder='Min'
                value={filters.length.min ?? ''}
                onChange={(e) => setLength('min', e.target.value)}
                className={inputClassName}
              />
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
        <Section>
          <div className='p-lg flex items-center justify-between gap-2'>
            <p className='text-lg font-medium'>Price</p>
            <div className='flex w-2/3 items-center gap-2'>
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
        <Section>
          <div className='p-lg flex items-center justify-between gap-2'>
            <p className='text-lg font-medium'>Offer</p>
            <div className='flex w-2/3 items-center gap-2'>
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
        <Section>
          <div className='p-lg flex w-full flex-row items-center justify-between'>
            <p className='text-lg font-medium'>Watchlists</p>
            <div className='flex w-2/3 flex-row gap-x-2'>
              <input
                type='number'
                inputMode='numeric'
                placeholder='Min'
                value={filters.watchersCount.min ?? ''}
                onChange={(e) => setWatchers('min', e.target.value)}
                className={inputClassName}
              />
              <input
                type='number'
                inputMode='numeric'
                placeholder='Max'
                value={filters.watchersCount.max ?? ''}
                onChange={(e) => setWatchers('max', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </Section>
        <Section>
          <div className='p-lg flex w-full flex-row items-center justify-between'>
            <p className='text-lg font-medium'>Views</p>
            <div className='flex w-2/3 flex-row gap-x-2'>
              <input
                type='number'
                inputMode='numeric'
                placeholder='Min'
                value={filters.viewCount.min ?? ''}
                onChange={(e) => setViews('min', e.target.value)}
                className={inputClassName}
              />
              <input
                type='number'
                inputMode='numeric'
                placeholder='Max'
                value={filters.viewCount.max ?? ''}
                onChange={(e) => setViews('max', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </Section>
        <Section>
          <div className='p-lg flex w-full flex-row items-center justify-between'>
            <p className='text-lg font-medium'>Categories</p>
            <div className='flex w-2/3 flex-row gap-x-2'>
              <input
                type='number'
                inputMode='numeric'
                placeholder='Min'
                value={filters.clubsCount.min ?? ''}
                onChange={(e) => setClubsCount('min', e.target.value)}
                className={inputClassName}
              />
              <input
                type='number'
                inputMode='numeric'
                placeholder='Max'
                value={filters.clubsCount.max ?? ''}
                onChange={(e) => setClubsCount('max', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </Section>
        <Section>
          <div className='p-lg flex w-full gap-2 md:flex-col'>
            <p className='text-lg font-medium'>Creation Date</p>
            <div className='flex gap-2'>
              <div className='relative w-1/2'>
                <button
                  onClick={() => {
                    setShowFromPicker(!showFromPicker)
                    setShowToPicker(false)
                  }}
                  className='border-primary/20 p-md hover:bg-secondary w-full cursor-pointer rounded-sm border-2 text-left text-lg transition-colors outline-none'
                >
                  {filters.creationDate.min ? (
                    formatDateDisplay(filters.creationDate.min)
                  ) : (
                    <span className='text-neutral'>Min date</span>
                  )}
                </button>
                {filters.creationDate.min && (
                  <div
                    className='absolute top-[15px] right-3 cursor-pointer transition-opacity hover:opacity-80'
                    onClick={() => update({ creationDate: { ...filters.creationDate, min: null } })}
                  >
                    <Cross width={12} height={12} />
                  </div>
                )}
              </div>
              <div className='relative w-1/2'>
                <button
                  onClick={() => {
                    setShowToPicker(!showToPicker)
                    setShowFromPicker(false)
                  }}
                  className='border-primary/20 p-md hover:bg-secondary w-full cursor-pointer rounded-sm border-2 text-left text-lg transition-colors outline-none'
                >
                  {filters.creationDate.max ? (
                    formatDateDisplay(filters.creationDate.max)
                  ) : (
                    <span className='text-neutral'>Max date</span>
                  )}
                </button>
                {filters.creationDate.max && (
                  <div
                    className='absolute top-[15px] right-3 cursor-pointer transition-opacity hover:opacity-80'
                    onClick={() => update({ creationDate: { ...filters.creationDate, max: null } })}
                  >
                    <Cross width={12} height={12} />
                  </div>
                )}
              </div>
            </div>
            {(showFromPicker || showToPicker) && (
              <div className='fixed top-0 left-0 z-1000 flex h-full w-full items-center justify-center bg-black/40 backdrop-blur-sm'>
                <DatePicker
                  onSelect={showFromPicker ? handleFromDateSelect : handleToDateSelect}
                  onClose={() => {
                    setShowFromPicker(false)
                    setShowToPicker(false)
                  }}
                  maxDate={maxDateObj}
                  minDate={minDateObj}
                  currentDate={
                    showFromPicker
                      ? filters.creationDate.min
                        ? new Date(filters.creationDate.min + 'T00:00:00')
                        : null
                      : filters.creationDate.max
                        ? new Date(filters.creationDate.max + 'T00:00:00')
                        : null
                  }
                  hideTime
                  className='w-[350px]'
                />
              </div>
            )}
          </div>
        </Section>
        <Section isLast>
          <div className='flex flex-col'>
            {MARKETPLACE_TYPE_FILTER_LABELS.map((label) => (
              <FilterDropdown<TypeFilterOption>
                key={label}
                label={label}
                value={filters.type[label]}
                options={TYPE_FILTER_OPTIONS}
                optionLabels={TYPE_FILTER_OPTION_LABELS}
                onChange={(value) => setTypeOption(label, value)}
                noneValue='none'
                dropdownPosition='top'
              />
            ))}
          </div>
        </Section>
      </div>

      <div
        className={cn(
          'flex min-w-full flex-col overflow-y-auto pb-8 transition-transform',
          showCategories && '-translate-x-full'
        )}
      >
        <div
          className='p-lg hover:bg-secondary border-tertiary flex w-full cursor-pointer items-center gap-2 border-b'
          onClick={() => setShowCategories(false)}
        >
          <Image src={arrowDown} alt='back' className='rotate-90 transition-all' />
          <p className='text-lg font-medium'>Categories</p>
        </div>
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
