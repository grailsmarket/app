import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import { useRouter } from 'next/navigation'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { CATEGORY_IMAGES } from '../[category]/components/categoryDetails'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { localizeNumber } from '@/utils/localizeNumber'

interface CategoryRowProps {
  category: CategoryType
}

const CategoryRow = ({ category }: CategoryRowProps) => {
  const router = useRouter()
  const categoryName = CATEGORY_LABELS[category.name as keyof typeof CATEGORY_LABELS]
  const categoryImage = CATEGORY_IMAGES[category.name as keyof typeof CATEGORY_IMAGES]

  return (
    <Link
      href={`/categories/${category.name}`}
      className='hover:bg-primary/10 p-lg flex w-full items-center justify-between gap-1 rounded-lg'
    >
      <div className='flex w-1/3 items-center gap-4'>
        <Image src={categoryImage.avatar} alt={categoryName} width={60} height={60} className='rounded-full' />
        <div className='flex flex-col gap-0.5'>
          <h3 className='text-2xl font-bold'>{categoryName}</h3>
          <p className='text-md text-neutral font-medium'>{category.description}</p>
        </div>
      </div>
      <div className='flex w-1/6 items-center gap-2'>{localizeNumber(category.member_count)} names</div>
      <div className='flex w-1/6 items-center gap-2'>{localizeNumber(category.total_sales_count)} sales</div>
      <div className='flex w-1/6 items-center gap-2'>
        <Price
          price={category.floor_price_wei}
          currencyAddress={category.floor_price_currency as Address}
          iconSize='22px'
          fontSize='text-xl font-semibold'
        />
      </div>
      <SecondaryButton className='w-20' onClick={() => router.push(`/categories/${category.name}`)}>
        View
      </SecondaryButton>
    </Link>
  )
}

export default CategoryRow
