'use client'

import { useId, useMemo, useState } from 'react'
import { useUserResolvers } from '@/hooks/ens-v2/useResolverData'
import { accessLabel } from '@/utils/web3/resolver-permissions'
import { useUserContext } from '@/context/user'
import { buttonClass, inputClass } from './ui'

export default function ResolverPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [focused, setFocused] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const { userAddress } = useUserContext()
  const id = useId()
  const query = useUserResolvers(value)
  const options = useMemo(
    () =>
      (query.data?.pages.flatMap((page) => page.items) ?? []).filter(
        (resolver) =>
          accessLabel(resolver.grants, userAddress) !== 'View only' &&
          (!value ||
            resolver.address.toLowerCase().includes(value.toLowerCase()) ||
            resolver.label?.toLowerCase().includes(value.toLowerCase()))
      ),
    [query.data, userAddress, value]
  )
  const open = expanded && focused && options.length > 0 && !disabled
  return (
    <div className='flex flex-col gap-2'>
      <button
        type='button'
        className={`${buttonClass} flex justify-between gap-2 text-left`}
        disabled={disabled}
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <span className='truncate'>
          Resolver: <span className='font-mono'>{value || 'Choose address'}</span>
        </span>
        <span aria-hidden>{expanded ? '−' : '+'}</span>
      </button>
      {expanded && (
        <div className='relative'>
          <input
            className={inputClass}
            aria-label='Resolver address'
            role='combobox'
            aria-autocomplete='list'
            aria-expanded={open}
            aria-controls={`${id}-options`}
            aria-activedescendant={open ? `${id}-${Math.max(0, Math.min(highlighted, options.length - 1))}` : undefined}
            autoComplete='off'
            spellCheck={false}
            value={value}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(event) => {
              onChange(event.target.value)
              setHighlighted(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setFocused(false)
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setFocused(true)
                setHighlighted((index) => Math.max(0, Math.min(index + 1, options.length - 1)))
              }
              if (event.key === 'ArrowUp') {
                event.preventDefault()
                setHighlighted((index) => Math.max(0, index - 1))
              }
              if (event.key === 'Enter' && open) {
                event.preventDefault()
                onChange(options[Math.max(0, Math.min(highlighted, options.length - 1))].address)
                setFocused(false)
              }
            }}
          />
          {open && (
            <div
              id={`${id}-options`}
              role='listbox'
              aria-label='Accessible resolvers'
              className='border-tertiary bg-background absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-xl'
              onScroll={(event) => {
                const list = event.currentTarget
                if (
                  list.scrollTop + list.clientHeight >= list.scrollHeight - 24 &&
                  query.hasNextPage &&
                  !query.isFetchingNextPage
                )
                  void query.fetchNextPage()
              }}
            >
              {options.map((resolver, index) => (
                <button
                  id={`${id}-${index}`}
                  type='button'
                  role='option'
                  aria-selected={index === highlighted}
                  key={resolver.address}
                  className={`flex w-full flex-col px-3 py-2 text-left ${index === highlighted ? 'bg-tertiary' : 'hover:bg-secondary'}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(resolver.address)
                    setFocused(false)
                  }}
                >
                  {resolver.label && <span>{resolver.label}</span>}
                  <span className='text-neutral truncate font-mono text-xs'>{resolver.address}</span>
                </button>
              ))}
            </div>
          )}
          {query.error && (
            <p className='text-neutral mt-1 text-xs'>
              Resolver suggestions are unavailable. You can still enter an address.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
