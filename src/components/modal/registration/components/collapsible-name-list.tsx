import { useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { ShortArrow } from 'ethereum-identity-kit'

interface CollapsibleNameListProps {
  names: string[]
}

const CollapsibleNameList: React.FC<CollapsibleNameListProps> = ({ names }) => {
  const [isOpen, setIsOpen] = useState(false)

  const dropdownRef = useClickAway(() => {
    setIsOpen(false)
  })

  return (
    <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative inline-block'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex cursor-pointer items-center gap-1 text-lg font-bold'
      >
        {names.length} names
        <ShortArrow className={cn('h-3 w-3 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
      </button>

      {isOpen && (
        <div className='bg-background border-tertiary absolute left-1/2 z-50 mt-1 max-h-[200px] w-max min-w-full -translate-x-1/2 overflow-y-auto rounded-md border-2 py-1 shadow-lg'>
          {names.map((name) => (
            <div key={name} className='px-4 py-1.5 text-lg font-medium'>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CollapsibleNameList
