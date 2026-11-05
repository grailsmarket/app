'use client'

import React from 'react'
import Image, { type StaticImageData } from 'next/image'
import { cn } from '@/utils/tailwind'

interface SegmentedOption<T extends string> {
  value: T
  label: string
  icon?: StaticImageData | string
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

// A small fixed choice with a sliding thumb, in place of a Dropdown with two to four options.
const Segmented = <T extends string>({ options, value, onChange, className }: SegmentedProps<T>) => {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  )

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        role='radiogroup'
        className='bg-secondary border-tertiary relative grid rounded-md border p-1'
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        <span
          aria-hidden='true'
          className='bg-primary/20 absolute top-1 bottom-1 left-1 rounded-sm shadow-[0_1px_2px_#00000066,inset_0_0_0_1px_var(--line-subtle)] transition-transform duration-300 ease-out motion-reduce:transition-none'
          style={{
            width: `calc((100% - 8px) / ${options.length})`,
            transform: `translateX(${selectedIndex * 100}%)`,
          }}
        />
        {options.map((option) => {
          const isSelected = option.value === value

          return (
            <button
              key={option.value}
              type='button'
              role='radio'
              aria-checked={isSelected}
              onClick={() => {
                if (!isSelected) onChange(option.value)
              }}
              className={cn(
                'focus-visible:outline-primary relative flex h-9.5 cursor-pointer items-center justify-center gap-2 rounded-sm text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed',
                isSelected ? 'text-foreground' : 'text-neutral hover:text-foreground'
              )}
            >
              {option.icon && <Image src={option.icon} alt='' width={18} height={18} className='h-4.5 w-4.5' />}
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Segmented
