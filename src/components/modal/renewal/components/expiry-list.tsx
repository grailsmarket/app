import { Check } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import { VersionBadge } from './renewal-subject'

export interface ExpiryListItem {
  name: string
  version: number
  /** Current expiry, e.g. "Mar 3, 2027", or null when unknown. */
  from: string | null
  /** Expiry after the renewal. */
  to: string | null
  /** Already extended in an earlier batch. */
  done?: boolean
}

// Every name of a renewal with the expiry it moves to (top) and the one it has now (below), in the
// bordered, divided rows of NameList. Names already extended get a check and lose the green date.
// Local stand-in for the design system's ExpiryList, which ui/modal does not have yet.
const ExpiryList: React.FC<{ items: ExpiryListItem[] }> = ({ items }) => {
  return (
    <ul className='bg-secondary scrollbar-custom border-tertiary flex max-h-66 shrink-0 flex-col overflow-y-auto rounded-lg border'>
      {items.map((item, index) => (
        <li
          key={item.name}
          className={cn(
            'border-tertiary flex min-h-12 items-center gap-2.5 px-3 py-1.5',
            index + 1 < items.length && 'border-b'
          )}
        >
          <span aria-hidden='true' className='gradient-blue h-6 w-6 shrink-0 rounded-sm' />
          <span className='flex min-w-0 flex-1 items-center gap-1.5'>
            <span className='min-w-0 truncate text-lg font-semibold'>{item.name}</span>
            <VersionBadge version={item.version} />
            {item.done && <Check className='h-3 w-3 shrink-0 text-green-400' aria-label='Extended' />}
          </span>
          <span className='flex shrink-0 flex-col items-end gap-px text-right tabular-nums'>
            <span className={cn('text-lg font-semibold', item.done ? 'text-foreground' : 'text-green-400')}>
              {item.to ?? 'Unknown'}
            </span>
            <span className='text-neutral text-md'>{item.from ? `from ${item.from}` : 'Unknown'}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export default ExpiryList
