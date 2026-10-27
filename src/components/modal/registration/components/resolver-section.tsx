import { SkeletonText } from '@/components/ui/loadingSkeleton'

import { useId, useState } from 'react'
import Disclosure from '@/components/ui/modal/disclosure'
import TextInput from '@/components/ui/modal/textInput'
import type { Resolver } from '@/types/ens'
import { cn } from '@/utils/tailwind'

interface ResolverSectionProps {
  resolver: string
  setResolver: (value: string) => void
  isLoading: boolean
  error: string | null
  options: Resolver[]
  warning: string | null
}

const ResolverSection: React.FC<ResolverSectionProps> = ({
  resolver,
  setResolver,
  isLoading,
  error,
  options,
  warning,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [activeOption, setActiveOption] = useState(-1)
  const listId = useId()
  const search = resolver.trim().toLowerCase()
  const matches = options.filter(
    (option) => option.address.toLowerCase().includes(search) || option.name?.toLowerCase().includes(search)
  )
  const selected = options.find((option) => option.address.toLowerCase() === search)
  const expanded = focused && matches.length > 0
  const choose = (option: Resolver) => {
    setResolver(option.address)
    setFocused(false)
    setActiveOption(-1)
  }

  return (
    <>
      <Disclosure
        title='Resolver'
        preview={
          selected?.name
            ? `${selected.name} · ${resolver}`
            : resolver || (isLoading ? <SkeletonText label='Checking resolver…' className='w-40' /> : 'Not set')
        }
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        description='Stores your name’s addresses and records.'
      >
        <TextInput
          aria-label='Resolver address'
          role='combobox'
          aria-autocomplete='list'
          aria-controls={listId}
          aria-expanded={expanded}
          aria-activedescendant={expanded && matches[activeOption] ? `${listId}-${activeOption}` : undefined}
          placeholder='Search a label or enter a resolver address'
          value={resolver}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            setResolver(event.target.value)
            setFocused(true)
            setActiveOption(-1)
          }}
          onKeyDown={(event) => {
            if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matches.length) {
              event.preventDefault()
              setFocused(true)
              const next =
                event.key === 'ArrowDown'
                  ? (activeOption + 1) % matches.length
                  : activeOption < 0
                    ? matches.length - 1
                    : (activeOption - 1 + matches.length) % matches.length
              setActiveOption(next)
              document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: 'nearest' })
            } else if (event.key === 'Enter' && expanded && matches[activeOption]) {
              event.preventDefault()
              choose(matches[activeOption])
            } else if (event.key === 'Escape' && expanded) {
              event.preventDefault()
              event.stopPropagation()
              setFocused(false)
            }
          }}
          autoComplete='off'
          spellCheck={false}
          error={error}
        />
        {expanded && (
          <div
            id={listId}
            role='listbox'
            aria-label='Available resolvers'
            className='border-tertiary bg-secondary max-h-48 overflow-y-auto rounded-md border'
          >
            {matches.map((option, index) => (
              <button
                key={option.address}
                id={`${listId}-${index}`}
                type='button'
                role='option'
                aria-selected={index === activeOption}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                className={cn(
                  'border-tertiary hover:bg-tertiary flex w-full cursor-pointer flex-col gap-1 border-b px-3 py-2 text-left last:border-b-0',
                  index === activeOption && 'bg-tertiary'
                )}
              >
                <span className='flex items-center gap-2 text-lg'>
                  {option.name && <span className='font-semibold'>{option.name}</span>}
                  {option.isDefault && <span className='text-primary text-sm'>Preferred</span>}
                </span>
                <span className='text-neutral text-md break-all'>{option.address}</span>
              </button>
            ))}
          </div>
        )}
      </Disclosure>
      {warning && (
        <p className='text-grace text-md' role='status'>
          {warning}
        </p>
      )}
    </>
  )
}

export default ResolverSection
