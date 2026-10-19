import { useState } from 'react'
import ExpandableSection from './expandable-section'

interface ResolverSectionProps {
  resolver: string
  setResolver: (value: string) => void
  isLoading: boolean
  error: string | null
}

const ResolverSection: React.FC<ResolverSectionProps> = ({ resolver, setResolver, isLoading, error }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <ExpandableSection
      title='Resolver'
      preview={resolver || (isLoading ? 'Checking…' : 'Not set')}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <p className='text-neutral text-sm'>Stores your name’s addresses and records.</p>
      <input
        aria-label='Resolver address'
        type='text'
        className='bg-background border-tertiary hover:bg-secondary focus:bg-secondary h-10 w-full rounded-md border px-3 py-2 text-lg transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
        placeholder='Resolver address (0x…)'
        value={resolver}
        onChange={(e) => setResolver(e.target.value)}
        autoComplete='off'
        spellCheck={false}
        aria-invalid={!!error}
      />
      {error && (
        <p className='text-sm text-red-400' role='alert'>
          {error}
        </p>
      )}
    </ExpandableSection>
  )
}

export default ResolverSection
