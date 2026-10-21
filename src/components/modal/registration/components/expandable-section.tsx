import { useId } from 'react'
import { ShortArrow } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'

interface ExpandableSectionProps {
  title: string
  preview: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ title, preview, isOpen, onToggle, children }) => {
  const contentId = useId()

  return (
    <div className='border-tertiary rounded-md border'>
      <button
        type='button'
        className='hover:bg-secondary flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors'
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className='shrink-0 text-lg font-medium'>{title}</span>
        <span className='flex min-w-0 items-center gap-2'>
          <span className='text-neutral truncate text-sm' title={preview}>
            {preview}
          </span>
          <ShortArrow className={cn('h-3 w-3 shrink-0 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
        </span>
      </button>
      <div id={contentId} className={cn('flex-col gap-2 px-3 pt-1 pb-3', isOpen ? 'flex' : 'hidden')}>
        {children}
      </div>
    </div>
  )
}

export default ExpandableSection
