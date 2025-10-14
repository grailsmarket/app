'use client'

import React, { useState } from 'react'
import { MagnifyingGlass } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'

interface SearchbarProps {
  onSearch: (search: string) => void
  placeholder?: string
  className?: string
  showSearchIcon?: boolean
}

const Searchbar: React.FC<SearchbarProps> = ({
  onSearch,
  placeholder = 'Search',
  className,
  showSearchIcon = true,
}) => {
  const [search, setSearch] = useState('')

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(search)
    }
  }

  return (
    <div
      className={cn(
        'bg-secondary border-foreground/10 focus-within:bg-tertiary hover:bg-tertiary active:bg-tertiary p-lg group relative flex items-center gap-2 rounded-md border-[1px] transition-all focus-within:scale-[1.01] focus-within:shadow-md',
        className
      )}
    >
      <input
        type='text'
        placeholder={placeholder}
        value={search}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className='w-full bg-transparent outline-none'
      />
      {showSearchIcon && (
        <MagnifyingGlass className='text-primary/50 group-focus-within:text-primary group-hover:text-primary h-6 w-6 cursor-pointer transition-colors' />
      )}
    </div>
  )
}

export default Searchbar
