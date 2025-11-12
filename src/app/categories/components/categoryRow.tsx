import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import { useRouter } from 'next/navigation'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { CATEGORY_IMAGES } from '../[category]/components/categoryDetails'
import { localizeNumber } from '@/utils/localizeNumber'
import PrimaryButton from '@/components/ui/buttons/primary'

interface CategoryRowProps {
  category: CategoryType
}

const CategoryRow = ({ category }: CategoryRowProps) => {
  const router = useRouter()
  const categoryName = CATEGORY_LABELS[category.name as keyof typeof CATEGORY_LABELS]
  const categoryImage = CATEGORY_IMAGES[category.name as keyof typeof CATEGORY_IMAGES]
  const categoryHeader = CATEGORY_IMAGES[category.name as keyof typeof CATEGORY_IMAGES].header

  return (
    <Link
      href={`/categories/${category.name}`}
      className='bg-secondary p-lg relative flex w-full flex-col gap-2 rounded-lg hover:bg-white/10'
    >
      <Image
        src={categoryHeader}
        alt={categoryName}
        width={1000}
        height={1000}
        className='absolute top-0 left-0 h-full w-full object-cover opacity-10'
      />
      <div className='z-10 flex items-center gap-4'>
        <Image src={categoryImage.avatar} alt={categoryName} width={60} height={60} className='rounded-full' />
        <div className='flex flex-col gap-0.5'>
          <h3 className='text-2xl font-bold'>{categoryName}</h3>
          <p className='text-neutral text-lg font-medium'>{category.description}</p>
        </div>
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-2xl'>Names</p>
        <p className='text-xl font-semibold'>{localizeNumber(category.member_count)}</p>
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-2xl'>Sales</p>
        <p className='text-xl font-semibold'>{localizeNumber(category.total_sales_count)}</p>
      </div>
      <div className='z-10 flex items-center justify-between gap-2'>
        <p className='font-sedan-sc text-2xl'>Floor Price</p>
        <Price
          price={category.floor_price_wei}
          currencyAddress={category.floor_price_currency as Address}
          iconSize='22px'
          fontSize='text-xl font-semibold'
        />
      </div>
      <PrimaryButton className='z-10 mt-2 w-full' onClick={() => router.push(`/categories/${category.name}`)}>
        View
      </PrimaryButton>
    </Link>
  )
}

export default CategoryRow
