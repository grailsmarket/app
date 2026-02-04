import React, { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import { localizeNumber } from '@/utils/localizeNumber'
import { selectCategoriesPageFilters } from '@/state/reducers/filters/categoriesPageFilters'
import { useAppSelector } from '@/state/hooks'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { cn } from '@/utils/tailwind'

interface CategoryRowProps {
  category: CategoryType
  reduceColumns?: boolean
}

const CategoryRow = ({ category, reduceColumns = false }: CategoryRowProps) => {
  const categoriesFilters = useAppSelector(selectCategoriesPageFilters)
  const categorySort = categoriesFilters.sort

  const salesTimeWindow = useMemo(() => {
    switch (categorySort) {
      case 'total_sales_volume_wei':
        return {
          label: '',
          value: category.total_sales_count,
        }
      case 'sales_volume_wei_1y':
        return {
          label: '1y',
          value: category.sales_count_1y,
        }
      case 'sales_volume_wei_1mo':
        return {
          label: '1mo',
          value: category.sales_count_1mo,
        }
      case 'sales_volume_wei_1w':
        return {
          label: '1w',
          value: category.sales_count_1w,
        }
      case 'total_sales_count':
        return {
          label: '',
          value: category.total_sales_count,
        }
      case 'sales_count_1y':
        return {
          label: '1y',
          value: category.sales_count_1y,
        }
      case 'sales_count_1mo':
        return {
          label: '1mo',
          value: category.sales_count_1mo,
        }
      case 'sales_count_1w':
        return {
          label: '1w',
          value: category.sales_count_1w,
        }
    }
  }, [categorySort, category])

  const volumeTimeWindow = useMemo(() => {
    switch (categorySort) {
      case 'total_sales_volume_wei':
        return {
          label: '',
          value: category.total_sales_volume_wei,
        }
      case 'sales_volume_wei_1y':
        return {
          label: '1y',
          value: category.sales_volume_wei_1y,
        }
      case 'sales_volume_wei_1mo':
        return {
          label: '1mo',
          value: category.sales_volume_wei_1mo,
        }
      case 'sales_volume_wei_1w':
        return {
          label: '1w',
          value: category.sales_volume_wei_1w,
        }
      case 'total_sales_count':
        return {
          label: '',
          value: category.total_sales_volume_wei,
        }
      case 'sales_count_1y':
        return {
          label: '1y',
          value: category.sales_volume_wei_1y,
        }
      case 'sales_count_1mo':
        return {
          label: '1mo',
          value: category.sales_volume_wei_1mo,
        }
      case 'sales_count_1w':
        return {
          label: '1w',
          value: category.sales_volume_wei_1w,
        }
    }
  }, [categorySort, category])

  const { name: categoryName, avatar: categoryAvatar, header: categoryHeader } = getCategoryDetails(category.name)

  return (
    <Link
      href={`/categories/${category.name}`}
      className='bg-secondary relative flex h-full w-full flex-col justify-between gap-2 rounded-lg hover:bg-white/10'
    >
      <div className='p-lg relative flex flex-row items-center gap-3 overflow-hidden rounded-t-lg min-h-[102px] max-h-[102px]'>
        <Image
          src={categoryHeader}
          alt={`${categoryName} header`}
          width={1000}
          height={1000}
          className='absolute top-0 left-0 h-full w-full object-cover opacity-20'
        />
        <div className='z-10 flex items-center gap-3'>
          <Image src={categoryAvatar} alt={categoryName} width={60} height={60} className='rounded-full' />
          <div className='flex flex-col'>
            <h3 className='text-2xl font-bold md:text-2xl'>{categoryName}</h3>
            <p className='text-neutral text-xl font-medium'>{category.description}</p>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'p-lg grid gap-4 gap-y-6',
          reduceColumns ? 'grid-cols-2 md:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-3 2xl:grid-cols-4'
        )}
      >
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>{localizeNumber(category.member_count)}</p>
          <p className='text-neutral text-lg'>Names</p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <Price
            price={volumeTimeWindow ? volumeTimeWindow.value : category.total_sales_volume_wei}
            currencyAddress={category.floor_price_currency as Address}
            iconSize='20px'
            fontSize='text-xl font-semibold'
          />
          <p className='text-neutral text-lg font-medium'>
            Volume&nbsp;
            <span className='text-lg'>
              {volumeTimeWindow?.label && volumeTimeWindow.label.length > 0 ? `(${volumeTimeWindow.label})` : ''}
            </span>
          </p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <Price
            price={category.floor_price_wei}
            currencyAddress={category.floor_price_currency as Address}
            iconSize='20px'
            fontSize='text-xl font-semibold'
          />
          <p className='text-neutral text-lg font-medium'>Floor</p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>
            {localizeNumber(salesTimeWindow ? salesTimeWindow.value : category.total_sales_count)}
          </p>
          <p className='text-neutral text-lg font-medium'>
            Sales&nbsp;
            <span className='text-lg'>
              {salesTimeWindow?.label && salesTimeWindow.label.length > 0 ? `(${salesTimeWindow.label})` : ''}
            </span>
          </p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>
            {localizeNumber(category.registered_count)}
            <span className='ml-1 text-lg font-medium'>({category.registered_percent.toFixed(1)}%)</span>
          </p>
          <p className='text-neutral text-lg'>Registered</p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>
            {localizeNumber(category.grace_count)}
            <span className='ml-1 text-lg font-medium'>({category.grace_percent.toFixed(1)}%)</span>
          </p>
          <p className='text-grace text-lg font-medium'>Grace</p>
        </div>
        {/* <div className='z-10 flex h-fit flex-col items-start border-l-2 border-neutral pl-2'>
          <p className='text-xl font-semibold'>
          <span className='mr-1 text-lg font-medium'>
          ({(category.registered_percent + category.grace_percent).toFixed(1)}%)
          </span>
          {localizeNumber(category.registered_count + category.grace_count)}
          </p>
          <p className='font-sedan-sc text-xl md:text-2xl'>
            Reg+<span className='text-grace'>Grace</span>
          </p>
        </div> */}
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>
            {localizeNumber(category.premium_count)}
            <span className='ml-1 text-lg font-medium'>
              (
              {category.member_count > 0
                ? ((category.premium_count / category.member_count) * 100).toLocaleString(navigator.language, {
                  maximumFractionDigits: 1,
                })
                : 0}
              %)
            </span>
          </p>
          <p className='text-premium text-lg font-medium'>Premium</p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>
            {localizeNumber(category.available_count)}
            <span className='ml-1 text-lg font-medium'>
              (
              {category.member_count > 0
                ? ((category.available_count / category.member_count) * 100).toLocaleString(navigator.language, {
                  maximumFractionDigits: 1,
                })
                : 0}
              %)
            </span>
          </p>
          <p className='text-available text-lg font-medium'>Available</p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <p className='text-xl font-semibold'>
            {localizeNumber(category.listings_count)}
            <span className='ml-1 text-lg font-medium'>({category.listings_percent.toFixed(1)}%)</span>
          </p>
          <p className='text-neutral text-lg font-medium'>Listings</p>
        </div>
        <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
          <div className='flex items-center gap-1'>
            <p className='text-xl font-semibold'>{localizeNumber(category.holders_count)}</p>
            <p className='text-lg font-semibold'>
              (
              {(category.member_count / category.holders_count).toLocaleString(navigator.language, {
                maximumFractionDigits: 1,
              })}
              )
            </p>
          </div>
          <p className='text-neutral text-lg font-medium'>Holders</p>
        </div>
      </div>
      {/* <PrimaryButton className='z-10 mt-2 h-8! w-full' onClick={() => router.push(`/categories/${category.name}`)}>
        View
      </PrimaryButton> */}
    </Link>
  )
}

export default CategoryRow
