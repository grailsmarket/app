'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { ShortArrow } from 'ethereum-identity-kit'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { useClickAway } from '@/hooks/useClickAway'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { cn } from '@/utils/tailwind'
import CheckIcon from 'public/icons/check.svg'

const MAX_SELECTED_CLUBS = 10

interface CategoryMultiSelectProps {
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
  compact?: boolean
}

const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({ selectedClubs, onSelectedClubsChange, compact }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { categories } = useCategories()
  const dropdownRef = useClickAway(() => setIsOpen(false))

  const label = useMemo(() => {
    if (selectedClubs.length === 0) return 'All Categories'
    if (selectedClubs.length === 1)
      return categories?.find((category) => category.name === selectedClubs[0])?.display_name
    return `${selectedClubs.length} Categories`
  }, [categories, selectedClubs])

  const toggleCategory = (categoryName: string) => {
    if (selectedClubs.includes(categoryName)) {
      onSelectedClubsChange(selectedClubs.filter((club) => club !== categoryName))
      return
    }
    if (selectedClubs.length >= MAX_SELECTED_CLUBS) return
    onSelectedClubsChange([...selectedClubs, categoryName])
  }

  return (
    <div
      ref={dropdownRef as React.RefObject<HTMLDivElement>}
      className={cn('relative', compact ? 'w-full' : 'max-w-1/2')}
    >
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          'border-tertiary hover:border-foreground/50 px-md flex h-10 w-full cursor-pointer items-center justify-between gap-1.5 rounded-sm border-2 bg-transparent transition-all md:px-3',
          compact ? 'text-sm' : 'sm:w-[210px]'
        )}
      >
        <div className='flex min-w-0 items-center gap-2'>
          {selectedClubs.length > 0 && (
            <div className='flex items-center -space-x-2.5'>
              {selectedClubs.slice(0, 3).map((club) => (
                <Image
                  key={club}
                  src={getCategoryDetails(club).avatar}
                  alt={club}
                  width={20}
                  height={20}
                  className='border-background h-5 w-5 rounded-full border'
                />
              ))}
            </div>
          )}
          <p className={cn('truncate font-medium whitespace-nowrap', compact ? 'text-sm' : 'text-md md:text-lg')}>
            {label}
          </p>
        </div>
        <ShortArrow className={cn('h-3 w-3 shrink-0 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
      </button>

      {isOpen && (
        <div className='bg-background border-tertiary absolute left-0 z-50 mt-1 max-h-[min(420px,60vh)] w-full min-w-[240px] overflow-y-auto rounded-md border-2 shadow-lg'>
          <button
            type='button'
            onClick={() => onSelectedClubsChange([])}
            className={cn(
              'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors',
              selectedClubs.length === 0 && 'bg-secondary'
            )}
          >
            All Categories
          </button>
          {categories?.map((category) => {
            const isSelected = selectedClubs.includes(category.name)
            const details = getCategoryDetails(category.name)
            return (
              <button
                key={category.name}
                type='button'
                onClick={() => toggleCategory(category.name)}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium transition-colors',
                  isSelected && 'bg-secondary'
                )}
              >
                <span className='flex min-w-0 items-center gap-2'>
                  <Image
                    src={details.avatar}
                    alt={category.display_name}
                    width={20}
                    height={20}
                    className='h-5 w-5 rounded-full'
                  />
                  <span className='truncate'>{category.display_name}</span>
                </span>
                {isSelected && <Image src={CheckIcon} alt='Selected' width={16} height={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CategoryMultiSelect
