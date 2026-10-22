import { useState } from 'react'
import Disclosure from '@/components/ui/modal/disclosure'
import TextInput from '@/components/ui/modal/textInput'

interface ResolverSectionProps {
  resolver: string
  setResolver: (value: string) => void
  isLoading: boolean
  error: string | null
}

const ResolverSection: React.FC<ResolverSectionProps> = ({ resolver, setResolver, isLoading, error }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Disclosure
      title='Resolver'
      preview={resolver || (isLoading ? 'Checking…' : 'Not set')}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      description='Stores your name’s addresses and records.'
    >
      <TextInput
        aria-label='Resolver address'
        placeholder='Resolver address (0x…)'
        value={resolver}
        onChange={(e) => setResolver(e.target.value)}
        autoComplete='off'
        spellCheck={false}
        error={error}
      />
    </Disclosure>
  )
}

export default ResolverSection
