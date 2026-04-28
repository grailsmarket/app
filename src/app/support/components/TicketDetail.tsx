'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import {
  getSupportTicket,
  postSupportMessage,
  reopenSupportTicket,
} from '@/api/support'
import { SupportTicketStatus } from '@/types/support'
import { cn } from '@/utils/tailwind'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Textarea from '@/components/ui/textarea'

interface TicketDetailProps {
  ticketId: number
  onBack: () => void
}

const TicketDetail: React.FC<TicketDetailProps> = ({ ticketId, onBack }) => {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => getSupportTicket(ticketId),
  })

  const replyMutation = useMutation({
    mutationFn: (body: string) => postSupportMessage(ticketId, body),
    onSuccess: () => {
      setReply('')
      setError(null)
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to post reply.'),
  })

  const reopenMutation = useMutation({
    mutationFn: () => reopenSupportTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Failed to reopen ticket.'),
  })

  if (isLoading) {
    return (
      <div className='py-12 text-center'>
        <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2' />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='border-tertiary text-neutral flex flex-col items-center gap-3 rounded-md border p-6 text-center'>
        <p>Ticket not found.</p>
        <SecondaryButton onClick={onBack}>Back to tickets</SecondaryButton>
      </div>
    )
  }

  const { ticket, messages } = data
  const status = ticket.status

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = reply.trim()
    if (!trimmed) return setError('Reply cannot be empty.')
    replyMutation.mutate(trimmed)
  }

  return (
    <article className='flex flex-col gap-6'>
      <header className='flex flex-col gap-3'>
        <div className='flex items-start justify-between gap-3'>
          <h2 className='text-foreground text-2xl font-semibold md:text-3xl'>{ticket.subject}</h2>
          <StatusBadge status={status} />
        </div>
        <p className='text-neutral text-sm'>
          Opened {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </p>
        {ticket.urls.length > 0 && (
          <div className='flex flex-col gap-1'>
            <p className='text-neutral text-xs font-semibold uppercase'>Linked URLs</p>
            <ul className='flex flex-col gap-0.5'>
              {ticket.urls.map((u) => (
                <li key={u}>
                  <a
                    href={u}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:underline'
                  >
                    {u}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <ul className='flex flex-col gap-3'>
        {messages.map((m) => (
          <li
            key={m.id}
            className={cn(
              'border-tertiary flex flex-col gap-2 rounded-md border p-4',
              m.authorRole === 'admin' && 'bg-primary/5 border-primary/20'
            )}
          >
            <div className='flex items-center justify-between text-sm'>
              <span
                className={cn(
                  'font-semibold',
                  m.authorRole === 'admin' ? 'text-primary' : 'text-foreground'
                )}
              >
                {m.authorRole === 'admin' ? 'Grails team' : 'You'}
              </span>
              <span className='text-neutral'>{format(new Date(m.createdAt), 'PPp')}</span>
            </div>
            <p className='text-foreground text-base whitespace-pre-wrap break-words'>{m.body}</p>
          </li>
        ))}
      </ul>

      {error && (
        <p className='rounded-md bg-red-500/10 p-3 text-sm text-red-400'>{error}</p>
      )}

      {status === 'open' && (
        <form onSubmit={handleReply} className='flex flex-col gap-3'>
          <Textarea
            label='Reply'
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder='Add a follow-up message...'
            disabled={replyMutation.isPending}
          />
          <div className='flex justify-end'>
            <PrimaryButton disabled={replyMutation.isPending}>
              {replyMutation.isPending ? 'Posting...' : 'Post reply'}
            </PrimaryButton>
          </div>
        </form>
      )}

      {status === 'closed' && (
        <div className='border-tertiary flex items-center justify-between gap-3 rounded-md border p-4'>
          <p className='text-neutral text-sm'>
            This ticket was closed. Reopen if the issue isn&apos;t resolved.
          </p>
          <PrimaryButton
            onClick={() => reopenMutation.mutate()}
            disabled={reopenMutation.isPending}
          >
            {reopenMutation.isPending ? 'Reopening...' : 'Reopen ticket'}
          </PrimaryButton>
        </div>
      )}

      {status === 'fixed' && (
        <p className='border-tertiary text-neutral rounded-md border p-4 text-sm'>
          This ticket is marked fixed. Open a new ticket if you encounter the issue again.
        </p>
      )}
    </article>
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

export default TicketDetail
