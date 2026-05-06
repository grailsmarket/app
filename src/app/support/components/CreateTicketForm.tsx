'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSupportTicket } from '@/api/support'
import Input from '@/components/ui/input'
import Textarea from '@/components/ui/textarea'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'

interface CreateTicketFormProps {
  onCreated: (ticketId: number) => void
  onCancel: () => void
}

const CreateTicketForm: React.FC<CreateTicketFormProps> = ({ onCreated, onCancel }) => {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [urls, setUrls] = useState<string[]>([''])
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
      onCreated(data.ticket.id)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create ticket.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmedSubject = subject.trim()
    const trimmedBody = body.trim()
    if (!trimmedSubject) return setError('Subject is required.')
    if (!trimmedBody) return setError('Description is required.')

    const cleanUrls: string[] = []
    for (const u of urls.map((u) => u.trim()).filter(Boolean)) {
      try {
        new URL(u)
        cleanUrls.push(u)
      } catch {
        return setError(`"${u}" is not a valid URL.`)
      }
    }

    mutation.mutate({ subject: trimmedSubject, body: trimmedBody, urls: cleanUrls })
  }

  const updateUrl = (index: number, value: string) => {
    setUrls((prev) => prev.map((u, i) => (i === index ? value : u)))
  }
  const addUrl = () => setUrls((prev) => [...prev, ''])
  const removeUrl = (index: number) =>
    setUrls((prev) => (prev.length === 1 ? [''] : prev.filter((_, i) => i !== index)))

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <Input
        label='Subject'
        type='text'
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder='Briefly describe the issue'
        labelClassName='min-w-[140px]!'
        disabled={mutation.isPending}
      />

      <Textarea
        label='Description'
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder='What happened? Steps to reproduce, expected vs. actual behavior, etc.'
        labelClassName='min-w-[140px]!'
        disabled={mutation.isPending}
      />

      <div className='flex flex-col gap-2'>
        <p className='text-foreground text-base font-semibold'>Related URLs (optional)</p>
        {urls.map((url, i) => (
          <div key={i} className='flex items-center gap-2'>
            <input
              type='url'
              value={url}
              onChange={(e) => updateUrl(i, e.target.value)}
              placeholder='https://grails.app/...'
              disabled={mutation.isPending}
              className='bg-secondary border-tertiary hover:bg-tertiary focus:bg-tertiary flex min-h-12 w-full items-center justify-between rounded-md border px-4 text-left transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
            />
            <button
              type='button'
              onClick={() => removeUrl(i)}
              disabled={mutation.isPending}
              className='text-neutral hover:text-foreground cursor-pointer px-2 text-2xl'
              aria-label='Remove URL'
            >
              ×
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={addUrl}
          disabled={mutation.isPending}
          className='text-primary hover:text-primary/80 w-fit cursor-pointer text-sm font-semibold'
        >
          + Add another URL
        </button>
      </div>

      {error && <p className='rounded-md bg-red-500/10 p-3 text-sm text-red-400'>{error}</p>}

      <div className='flex items-center justify-end gap-2'>
        <SecondaryButton onClick={onCancel} disabled={mutation.isPending}>
          Cancel
        </SecondaryButton>
        <PrimaryButton disabled={mutation.isPending}>
          {mutation.isPending ? 'Submitting...' : 'Submit ticket'}
        </PrimaryButton>
      </div>
    </form>
  )
}

export default CreateTicketForm
