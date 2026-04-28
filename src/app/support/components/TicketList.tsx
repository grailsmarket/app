'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { listSupportTickets } from '@/api/support'
import { SupportTicketStatus } from '@/types/support'
import { cn } from '@/utils/tailwind'
import { useState } from 'react'

const STATUSES: { value: SupportTicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'fixed', label: 'Fixed' },
]

interface TicketListProps {
  onOpenTicket: (id: number) => void
}

const TicketList: React.FC<TicketListProps> = ({ onOpenTicket }) => {
  const [status, setStatus] = useState<SupportTicketStatus>('open')

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['support-tickets', status],
    queryFn: () => listSupportTickets({ status, limit: 50 }),
  })

  const tickets = data?.tickets ?? []

  return (
    <div className='flex flex-col gap-4'>
      <div className='border-tertiary flex gap-1 border-b'>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type='button'
            onClick={() => setStatus(s.value)}
            className={cn(
              'cursor-pointer px-4 py-2 text-base font-semibold transition-colors',
              status === s.value
                ? 'text-foreground border-primary -mb-px border-b-2'
                : 'text-neutral hover:text-foreground'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className='py-12 text-center'>
          <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2' />
        </div>
      )}

      {isError && (
        <div className='border-tertiary text-neutral rounded-md border p-6 text-center'>
          {error instanceof Error ? error.message : 'Failed to load tickets.'}
        </div>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <div className='border-tertiary text-neutral rounded-md border p-6 text-center'>
          No {status} tickets.
        </div>
      )}

      <ul className='flex flex-col gap-2'>
        {tickets.map((ticket) => (
          <li key={ticket.id}>
            <button
              type='button'
              onClick={() => onOpenTicket(ticket.id)}
              className='border-tertiary hover:bg-tertiary/40 flex w-full cursor-pointer flex-col gap-1 rounded-md border p-4 text-left transition-colors'
            >
              <div className='flex items-start justify-between gap-3'>
                <span className='text-foreground text-lg font-semibold'>{ticket.subject}</span>
                <StatusBadge status={ticket.status} />
              </div>
              <div className='text-neutral flex items-center gap-3 text-sm'>
                <span>
                  Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                </span>
                {typeof ticket.messageCount === 'number' && (
                  <span>· {ticket.messageCount} messages</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const StatusBadge: React.FC<{ status: SupportTicketStatus }> = ({ status }) => {
  const styles: Record<SupportTicketStatus, string> = {
    open: 'bg-primary/20 text-primary',
    closed: 'bg-neutral/20 text-neutral',
    fixed: 'bg-emerald-500/20 text-emerald-400',
  }
  return (
    <span className={cn('rounded-sm px-2 py-0.5 text-xs font-semibold uppercase', styles[status])}>
      {status}
    </span>
  )
}

export default TicketList
