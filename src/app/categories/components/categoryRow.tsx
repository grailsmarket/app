'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import { localizeNumber } from '@/utils/localizeNumber'
import { selectCategoriesPageFilters } from '@/state/reducers/filters/categoriesPageFilters'
import { useAppSelector } from '@/state/hooks'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { cn } from '@/utils/tailwind'
import { useClickAway } from '@/hooks/useClickAway'
import { ShortArrow, useWindowSize, useIsClient } from 'ethereum-identity-kit'

interface CategoryRowProps {
  category: CategoryType
  sort?: string
}

const CategoryRow = ({ category, sort }: CategoryRowProps) => {
  const categoriesFilters = useAppSelector(selectCategoriesPageFilters)
  const categorySort = sort || categoriesFilters.sort
  const [isExpanded, setIsExpanded] = useState(false)
  const clickawayRef = useClickAway<HTMLDivElement>(() => setIsExpanded(false))
  const router = useRouter()
  const clickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = useCallback(() => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current)
      clickTimeout.current = null
      router.push(`/categories/${category.name}`)
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null
        setIsExpanded((prev) => !prev)
      }, 250)
    }
  }, [category.name, router])

  const getCategorySortTimeWindow = (sort: string) => {
    return sort.includes('total') ? 'total' : (sort.split('_').slice(-1)[0] as '1y' | '1mo' | '1w')
  }

  const salesTimeWindow = useMemo(() => {
    const timeWindow = getCategorySortTimeWindow(categorySort)
    switch (timeWindow) {
      case 'total':
        return { label: '', value: category.total_sales_count }
      case '1y':
        return { label: '1y', value: category.sales_count_1y }
      case '1mo':
        return { label: '1mo', value: category.sales_count_1mo }
      case '1w':
        return { label: '1w', value: category.sales_count_1w }
      default:
        return { label: '', value: category.total_sales_count }
    }
  }, [categorySort, category])

  const volumeTimeWindow = useMemo(() => {
    const timeWindow = getCategorySortTimeWindow(categorySort)
    switch (timeWindow) {
      case 'total':
        return { label: '', value: category.total_sales_volume_wei }
      case '1y':
        return { label: '1y', value: category.sales_volume_wei_1y }
      case '1mo':
        return { label: '1mo', value: category.sales_volume_wei_1mo }
      case '1w':
        return { label: '1w', value: category.sales_volume_wei_1w }
      default:
        return { label: '', value: category.total_sales_volume_wei }
    }
  }, [categorySort, category])

  const registrationsTimeWindow = useMemo(() => {
    const timeWindow = getCategorySortTimeWindow(categorySort)
    switch (timeWindow) {
      case 'total':
        return { label: '', value: category.total_reg_count }
      case '1y':
        return { label: '1y', value: category.reg_count_1y }
      case '1mo':
        return { label: '1mo', value: category.reg_count_1mo }
      case '1w':
        return { label: '1w', value: category.reg_count_1w }
      default:
        return { label: '', value: category.total_reg_count }
    }
  }, [categorySort, category])

  const registrationsVolumeTimeWindow = useMemo(() => {
    const timeWindow = getCategorySortTimeWindow(categorySort)
    switch (timeWindow) {
      case 'total':
        return { label: '', value: category.total_reg_volume_wei }
      case '1y':
        return { label: '1y', value: category.reg_volume_wei_1y }
      case '1mo':
        return { label: '1mo', value: category.reg_volume_wei_1mo }
      case '1w':
        return { label: '1w', value: category.reg_volume_wei_1w }
      default:
        return { label: '', value: category.total_reg_volume_wei }
    }
  }, [categorySort, category])

  const { avatar: categoryAvatar, header: categoryHeader } = getCategoryDetails(category.name)

  const isClient = useIsClient()
  const { width } = useWindowSize()

  const StatItem = ({
    label,
    children,
    colorClass,
  }: {
    label: string
    children: React.ReactNode
    colorClass?: string
  }) => (
    <div className='border-tertiary z-10 flex h-fit flex-col items-start border-l-2 pl-1.5'>
      <div className='text-lg font-semibold'>{children}</div>
      <p className={cn('text-md font-medium', colorClass || 'text-neutral')}>{label}</p>
    </div>
  )

  const allQuickStats = useMemo(
    () => [
      {
        key: 'names',
        label: 'Names',
        render: () => <p>{localizeNumber(category.member_count ?? 0)}</p>,
      },
      {
        key: 'volume',
        label: `Vol${volumeTimeWindow.label ? ` (${volumeTimeWindow.label})` : ''}`,
        render: () => (
          <Price
            price={volumeTimeWindow.value}
            currencyAddress={category.floor_price_currency as Address}
            iconSize='16px'
            fontSize='text-lg font-semibold'
          />
        ),
      },
      {
        key: 'floor',
        label: 'Floor',
        render: () => (
          <Price
            price={category.floor_price_wei}
            currencyAddress={category.floor_price_currency as Address}
            iconSize='16px'
            fontSize='text-lg font-semibold'
          />
        ),
      },
      {
        key: 'sales',
        label: `Sales${salesTimeWindow.label ? ` (${salesTimeWindow.label})` : ''}`,
        render: () => <p>{localizeNumber(salesTimeWindow.value)}</p>,
      },
      {
        key: 'registered',
        label: 'Registered',
        render: () => (
          <div className='flex items-center gap-[3px]'>
            <p>{localizeNumber(category.registered_count ?? 0)}</p>
            <p className='text-md text-neutral pt-px font-medium'>({(category.registered_percent ?? 0).toFixed(1)}%)</p>
          </div>
        ),
      },
      {
        key: 'available',
        label: 'Available',
        colorClass: 'text-available',
        render: () => (
          <div className='flex items-center gap-[3px]'>
            <p>{localizeNumber(category.available_count ?? 0)}</p>
            <p className='text-md text-neutral pt-px font-medium'>
              (
              {category.member_count && category.member_count > 0
                ? (((category.available_count ?? 0) / category.member_count) * 100).toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })
                : 0}
              %)
            </p>
          </div>
        ),
      },
      {
        key: 'listings',
        label: 'Listings',
        render: () => (
          <div className='flex items-center gap-[3px]'>
            <p>{localizeNumber(category.listings_count ?? 0)}</p>
            <p className='text-md text-neutral pt-px font-medium'>({(category.listings_percent ?? 0).toFixed(1)}%)</p>
          </div>
        ),
      },
      {
        key: 'holders',
        label: 'Holders',
        render: () => (
          <div className='flex items-center gap-[3px]'>
            <p>{localizeNumber(category.holders_count ?? 0)}</p>
            <p className='text-md text-neutral pt-px font-medium'>
              (
              {category.holders_count && category.holders_count > 0
                ? (category.member_count / category.holders_count).toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })
                : 0}
              )
            </p>
          </div>
        ),
      },
    ],
    [category, salesTimeWindow, volumeTimeWindow]
  )

  const visibleStatsCount = useMemo(() => {
    if (!isClient || !width) return 1
    const available = width - 292
    return Math.max(1, Math.min(allQuickStats.length, Math.floor(available / 160)))
  }, [isClient, width, allQuickStats.length])

  const visibleStats = allQuickStats.slice(0, visibleStatsCount)

  return (
    <div ref={clickawayRef} className='relative w-full'>
      <div
        className={cn(
          'border-tertiary active:bg-foreground/5 hover:bg-foreground/5 relative flex h-[72px] w-full cursor-pointer flex-row items-center gap-3 overflow-hidden border-b px-3 transition',
          isExpanded && 'border-b-0'
        )}
        onClick={handleClick}
      >
        <Image
          src={categoryHeader}
          alt={`${category.display_name} header`}
          width={1600}
          height={200}
          className='absolute top-0 left-0 h-full w-full object-cover opacity-10'
        />
        <Link
          href={`/categories/${category.name}`}
          className='z-10 flex min-w-0 shrink items-center gap-3'
          style={{ flex: '0 1 200px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={categoryAvatar}
            alt={category.display_name}
            width={36}
            height={36}
            className='h-9 w-9 shrink-0 rounded-full transition-opacity hover:opacity-70'
          />
          <div className='flex min-w-0 flex-col'>
            <h3 className='truncate text-lg font-bold transition-opacity hover:opacity-70'>{category.display_name}</h3>
            <p className='text-neutral text-md truncate font-medium transition-opacity hover:opacity-70'>
              {category.description}
            </p>
          </div>
        </Link>
        <div className='z-10 flex flex-1 items-center justify-center'>
          {visibleStats.map((stat) => (
            <div
              key={stat.key}
              className='border-tertiary flex max-w-[160px] min-w-0 flex-1 flex-col items-start border-l-2 pl-1.5'
            >
              <div className='text-lg font-semibold'>{stat.render()}</div>
              <p className={cn('text-md font-medium text-nowrap', stat.colorClass || 'text-neutral')}>{stat.label}</p>
            </div>
          ))}
        </div>
        <ShortArrow
          className={cn(
            'text-neutral z-10 h-4 w-4 shrink-0 transition-transform',
            isExpanded ? 'rotate-0' : 'rotate-180'
          )}
        />
      </div>
      <div
        className={cn(
          'absolute top-[72px] right-0 left-0 z-40 grid shadow-md transition-[grid-template-rows] duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='min-h-0 overflow-hidden'>
          <div className='bg-background border-tertiary border-b p-4 pt-3 shadow-md'>
            <div className='grid grid-cols-3 gap-x-4 gap-y-3 md:grid-cols-4 lg:grid-cols-6'>
              <StatItem label='Names'>
                <p>{localizeNumber(category.member_count ?? 0)}</p>
              </StatItem>
              <StatItem label={`Volume${volumeTimeWindow.label ? ` (${volumeTimeWindow.label})` : ''}`}>
                <Price
                  price={volumeTimeWindow.value}
                  currencyAddress={category.floor_price_currency as Address}
                  iconSize='16px'
                  fontSize='text-lg'
                />
              </StatItem>
              <StatItem label='Floor'>
                <Price
                  price={category.floor_price_wei}
                  currencyAddress={category.floor_price_currency as Address}
                  iconSize='16px'
                  fontSize='text-lg'
                />
              </StatItem>
              <StatItem label={`Sales${salesTimeWindow.label ? ` (${salesTimeWindow.label})` : ''}`}>
                <p>{localizeNumber(salesTimeWindow.value)}</p>
              </StatItem>
              <StatItem label='Registered'>
                <div className='flex items-center gap-[3px]'>
                  <p>{localizeNumber(category.registered_count ?? 0)}</p>
                  <p className='text-md text-neutral pt-px font-medium'>
                    ({(category.registered_percent ?? 0).toFixed(1)}%)
                  </p>
                </div>
              </StatItem>
              <StatItem label='Grace' colorClass='text-grace'>
                <div className='flex items-center gap-[3px]'>
                  <p>{localizeNumber(category.grace_count ?? 0)}</p>
                  <p className='text-md text-neutral pt-px font-medium'>
                    ({(category.grace_percent ?? 0).toFixed(1)}%)
                  </p>
                </div>
              </StatItem>
              <StatItem label='Premium' colorClass='text-premium'>
                <div className='flex items-center gap-[3px]'>
                  <p>{localizeNumber(category.premium_count ?? 0)}</p>
                  <p className='text-md text-neutral pt-px font-medium'>
                    (
                    {category.member_count && category.member_count > 0
                      ? (((category.premium_count ?? 0) / category.member_count) * 100).toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })
                      : 0}
                    %)
                  </p>
                </div>
              </StatItem>
              <StatItem label='Available' colorClass='text-available'>
                <div className='flex items-center gap-[3px]'>
                  <p>{localizeNumber(category.available_count ?? 0)}</p>
                  <p className='text-md text-neutral pt-px font-medium'>
                    (
                    {category.member_count && category.member_count > 0
                      ? (((category.available_count ?? 0) / category.member_count) * 100).toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })
                      : 0}
                    %)
                  </p>
                </div>
              </StatItem>
              <StatItem label='Listings'>
                <div className='flex items-center gap-[3px]'>
                  <p>{localizeNumber(category.listings_count ?? 0)}</p>
                  <p className='text-md text-neutral pt-px font-medium'>
                    ({(category.listings_percent ?? 0).toFixed(1)}%)
                  </p>
                </div>
              </StatItem>
              <StatItem
                label={`${registrationsTimeWindow.label.length > 0 ? 'Regs' : 'Registrations'}${registrationsTimeWindow.label ? ` (${registrationsTimeWindow.label})` : ''}`}
              >
                <p>{localizeNumber(registrationsTimeWindow.value)}</p>
              </StatItem>
              <StatItem
                label={`Reg Vol${registrationsVolumeTimeWindow.label ? ` (${registrationsVolumeTimeWindow.label})` : ''}`}
              >
                <Price
                  price={registrationsVolumeTimeWindow.value}
                  currencyAddress={category.floor_price_currency as Address}
                  iconSize='16px'
                  fontSize='text-lg'
                />
              </StatItem>
              <StatItem label='Holders'>
                <div className='flex items-center gap-[3px]'>
                  <p>{localizeNumber(category.holders_count ?? 0)}</p>
                  <p className='text-md text-neutral pt-px font-medium'>
                    (
                    {category.holders_count && category.holders_count > 0
                      ? (category.member_count / category.holders_count).toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })
                      : 0}
                    )
                  </p>
                </div>
              </StatItem>
            </div>
            <div className='border-tertiary mt-3 flex items-center justify-end border-t pt-3'>
              <Link href={`/categories/${category.name}`} className='text-primary text-xl font-medium hover:underline'>
                View Category →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryRow
