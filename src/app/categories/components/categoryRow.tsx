import React, { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { CATEGORY_IMAGES } from '../[category]/components/categoryDetails'
import { localizeNumber } from '@/utils/localizeNumber'
import { selectCategoriesPageFilters } from '@/state/reducers/filters/categoriesPageFilters'
import { useAppSelector } from '@/state/hooks'

interface CategoryRowProps {
  category: CategoryType
}

const CategoryRow = ({ category }: CategoryRowProps) => {
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

  const categoryName = CATEGORY_LABELS[category.name as keyof typeof CATEGORY_LABELS]
  const categoryImage = CATEGORY_IMAGES[category.name as keyof typeof CATEGORY_IMAGES]
  const categoryHeader = CATEGORY_IMAGES[category.name as keyof typeof CATEGORY_IMAGES].header

  return (
    <Link
      href={`/categories/${category.name}`}
      className='bg-secondary p-lg relative flex h-full w-full flex-col justify-between gap-2 rounded-lg hover:bg-white/10'
    >
      <Image
        src={categoryHeader}
        alt={categoryName}
        width={1000}
        height={1000}
        className='absolute top-0 left-0 h-full w-full object-cover opacity-10'
      />
      <div className='z-10 flex items-center gap-3'>
        <Image src={categoryImage.avatar} alt={categoryName} width={60} height={60} className='rounded-full' />
        <div className='flex flex-col gap-0.5'>
          <h3 className='text-xl font-bold md:text-2xl'>{categoryName}</h3>
          <p className='text-neutral text-lg font-medium'>{category.description}</p>
        </div>
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-xl md:text-2xl'>Names</p>
        <p className='text-xl font-semibold'>{localizeNumber(category.member_count)}</p>
      </div>
      <div className='text-premium z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-xl md:text-2xl'>Premium</p>
        <p className='text-xl font-semibold'>
          <span className='mr-1 text-lg font-medium'>
            (
            {category.member_count > 0
              ? ((category.premium_count / category.member_count) * 100).toLocaleString(navigator.language, {
                  maximumFractionDigits: 1,
                })
              : 0}
            %)
          </span>
          {localizeNumber(category.premium_count)}
        </p>
      </div>
      <div className='text-available z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-xl md:text-2xl'>Available</p>
        <p className='text-xl font-semibold'>
          <span className='mr-1 text-lg font-medium'>
            (
            {category.member_count > 0
              ? ((category.available_count / category.member_count) * 100).toLocaleString(navigator.language, {
                  maximumFractionDigits: 1,
                })
              : 0}
            %)
          </span>
          {localizeNumber(category.available_count)}
        </p>
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-xl md:text-2xl'>
          Sales{' '}
          <span className='text-lg font-medium md:text-xl'>
            {salesTimeWindow?.label && salesTimeWindow.label.length > 0 ? `(${salesTimeWindow.label})` : ''}
          </span>
        </p>
        <p className='text-xl font-semibold'>
          {localizeNumber(salesTimeWindow ? salesTimeWindow.value : category.total_sales_count)}
        </p>
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-xl md:text-2xl'>
          Volume{' '}
          <span className='text-lg font-medium md:text-xl'>
            {volumeTimeWindow?.label && volumeTimeWindow.label.length > 0 ? `(${volumeTimeWindow.label})` : ''}
          </span>
        </p>
        <Price
          price={volumeTimeWindow ? volumeTimeWindow.value : category.total_sales_volume_wei}
          currencyAddress={category.floor_price_currency as Address}
          iconSize='22px'
          fontSize='text-xl font-semibold'
        />
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-xl md:text-2xl'>Floor Price</p>
        <Price
          price={category.floor_price_wei}
          currencyAddress={category.floor_price_currency as Address}
          iconSize='22px'
          fontSize='text-xl font-semibold'
        />
      </div>
      {/* <PrimaryButton className='z-10 mt-2 h-8! w-full' onClick={() => router.push(`/categories/${category.name}`)}>
        View
      </PrimaryButton> */}
    </Link>
  )
}

export default CategoryRow
