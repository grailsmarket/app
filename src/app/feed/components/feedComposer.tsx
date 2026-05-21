'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import NameImage from '@/components/ui/nameImage'
import LoadingCell from '@/components/ui/loadingCell'
import { useDebounce } from '@/hooks/useDebounce'
import { useCommentQuota } from '@/hooks/comments/useCommentQuota'
import { postComment, type PostCommentError } from '@/api/comments/postComment'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useUserContext } from '@/context/user'
import { beautifyName, normalizeName } from '@/lib/ens'
import { parseNameIdentifierSearch } from '@/utils/searchIdentifiers'
import { cn } from '@/utils/tailwind'
import ReplyArrowIcon from './replyArrowIcon'
import { useClickAway } from '@/hooks/useClickAway'
import { getNameTokenId } from '@/utils/web3/ens'
import { Cross } from 'ethereum-identity-kit'

const MAX_COMMENT_LENGTH = 500

interface FeedComposerProps {
  selectedName: string | null
  onSelectedNameChange: (name: string | null) => void
  onSubmitSuccess: () => void
}

const FeedComposer: React.FC<FeedComposerProps> = ({ selectedName, onSelectedNameChange, onSubmitSuccess }) => {
  const [nameInput, setNameInput] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDomainDropdownOpen, setIsDomainDropdownOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const { authStatus } = useUserContext()
  const queryClient = useQueryClient()

  const domainDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsDomainDropdownOpen(false)
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownItemRefs = useRef<Array<HTMLButtonElement | null>>([])
  const debouncedNameInput = useDebounce(nameInput.trim(), 300)
  const identifierSearch = parseNameIdentifierSearch(debouncedNameInput)
  const quota = useCommentQuota()

  const domainsQuery = useQuery({
    queryKey: ['comments', 'feed', 'target-search', debouncedNameInput],
    queryFn: () =>
      fetchDomains({
        limit: 5,
        pageParam: 1,
        filters: emptyFilterState,
        searchTerm: debouncedNameInput,
        enableBulkSearch: true,
        resolveIdentifiers: true,
      }),
    enabled: debouncedNameInput.length > 0,
  })

  const domains = domainsQuery.data?.domains.slice(0, 5) ?? []

  useEffect(() => {
    if (!debouncedNameInput || domains.length === 0) return
    if (debouncedNameInput !== nameInput.trim()) return

    const normalizedInput = debouncedNameInput.endsWith('.eth') ? normalizeName(debouncedNameInput) : null
    console.log(normalizedInput, selectedName)
    if (selectedName === normalizedInput) return

    onSelectedNameChange(normalizedInput)
  }, [debouncedNameInput, identifierSearch])

  useEffect(() => {
    setNameInput(selectedName ?? '')
    if (selectedName) requestAnimationFrame(() => textareaRef.current?.focus())
  }, [selectedName])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [debouncedNameInput, domains.length])

  useEffect(() => {
    if (!isDomainDropdownOpen) return
    const el = dropdownItemRefs.current[highlightedIndex]
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, isDomainDropdownOpen])

  const selectDomain = (name: string) => {
    onSelectedNameChange(normalizeName(name))
    setIsDomainDropdownOpen(false)
  }

  const post = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) => postComment({ name, body: value }),
    onSuccess: () => {
      setBody('')
      setError(null)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      onSubmitSuccess()
      queryClient.invalidateQueries({ queryKey: ['comments', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['comments', 'quota'] })
    },
    onError: (e: PostCommentError) => {
      if (e.code === 'COMMENT_BANNED') setError('You are banned from commenting')
      else if (e.code === 'QUOTA_EXCEEDED') setError('Daily limit reached. Try again later.')
      else setError(e.message ?? 'Failed to post comment')
    },
  })

  const used = quota.data?.used ?? 0
  const max = quota.data?.max ?? 0
  const remaining = quota.data?.remaining ?? Math.max(0, max - used)
  const quotaExhausted = quota.data ? remaining <= 0 : false
  const composerLocked = !selectedName || authStatus !== 'authenticated' || quotaExhausted

  const autoSize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const submit = () => {
    const trimmed = body.trim()
    if (!selectedName || !trimmed || post.isPending || composerLocked) return
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Comment too long (max ${MAX_COMMENT_LENGTH} characters)`)
      return
    }
    post.mutate({ name: selectedName, value: trimmed })
  }

  const hasSearchResults =
    nameInput.trim().length > 0 && !selectedName && (domainsQuery.isLoading || domains.length > 0)

  return (
    <div className='border-tertiary border-t-2'>
      <div className='bg-background mx-auto flex max-w-5xl flex-col gap-2 p-3 sm:px-4'>
        {error && <p className='text-sm font-medium text-red-400'>{error}</p>}
        <div ref={domainDropdownRef} className='relative'>
          {hasSearchResults && isDomainDropdownOpen && (
            <div className='bg-background border-tertiary absolute right-0 bottom-[calc(100%+6px)] left-0 z-40 max-h-72 overflow-y-auto rounded-md border-2 shadow-lg'>
              {domainsQuery.isLoading ? (
                <div className='flex flex-col gap-2 p-3'>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LoadingCell key={index} height='36px' width='100%' />
                  ))}
                </div>
              ) : (
                domains.map((domain, index) => {
                  const domainClubs = domain.clubs ?? []
                  const isHighlighted = index === highlightedIndex

                  return (
                    <button
                      key={domain.id}
                      ref={(el) => {
                        dropdownItemRefs.current[index] = el
                      }}
                      type='button'
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectDomain(domain.name)}
                      className={cn(
                        'flex w-full items-center gap-2 p-3 text-left transition-colors',
                        isHighlighted ? 'bg-primary/10' : 'hover:bg-primary/10'
                      )}
                    >
                      <NameImage
                        name={domain.name}
                        tokenId={domain.token_id}
                        expiryDate={domain.expiry_date}
                        className='min-h-9 min-w-9 h-9 w-9 rounded-sm'
                      />
                      <div className='min-w-0'>
                        <p className='truncate font-semibold'>{beautifyName(domain.name)}</p>
                        {domainClubs.length > 0 && (
                          <p className='text-neutral truncate text-sm'>{domainClubs.join(', ')}</p>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
          <div
            className={cn(
              'border-tertiary focus-within:border-foreground/50 flex min-h-10 w-full items-center gap-2.5 rounded-md border-2 bg-transparent px-3 py-1 transition-colors',
              selectedName && 'pl-1'
            )}
          >
            {selectedName && (
              <NameImage
                name={selectedName}
                tokenId={getNameTokenId(normalizeName(selectedName))}
                expiryDate={
                  domainsQuery.data?.domains.find((domain) => domain.name === selectedName)?.expiry_date ?? null
                }
                className='h-8 min-h-8 w-8 min-w-8 rounded-sm'
              />
            )}
            <input
              value={nameInput}
              onChange={(e) => {
                const value = e.target.value
                setNameInput(value)
                if (selectedName !== normalizeName(value)) onSelectedNameChange(null)
                setIsDomainDropdownOpen(true)
                if (error) setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  if (!isDomainDropdownOpen) setIsDomainDropdownOpen(true)
                  if (domains.length > 0) setHighlightedIndex((i) => Math.min(domains.length - 1, i + 1))
                  return
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  if (!isDomainDropdownOpen) setIsDomainDropdownOpen(true)
                  if (domains.length > 0) setHighlightedIndex((i) => Math.max(0, i - 1))
                  return
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  setIsDomainDropdownOpen(false)
                  return
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (isDomainDropdownOpen && domains[highlightedIndex]) {
                    selectDomain(domains[highlightedIndex].name)
                    return
                  }
                  const inputValue = e.currentTarget.value
                  if (inputValue.endsWith('.eth')) {
                    onSelectedNameChange(normalizeName(inputValue))
                  }
                }
              }}
              onFocus={() => setIsDomainDropdownOpen(true)}
              placeholder='ENS name, namehash, tokenId, or labelhash'
              className='text-md w-full bg-transparent font-medium outline-none md:text-lg'
            />
            {selectedName && (
              <button type='button' onClick={() => onSelectedNameChange(null)}>
                <Cross className='text-neutral hover:text-foreground h-4 w-4 transition-colors' />
              </button>
            )}
          </div>
        </div>
        <div className='bg-secondary border-tertiary p-md flex items-start gap-2 rounded-md border pl-3'>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              autoSize()
              if (error) setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            disabled={composerLocked || post.isPending}
            rows={1}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder={
              authStatus !== 'authenticated'
                ? 'Sign in to post a comment...'
                : selectedName
                  ? quotaExhausted
                    ? 'Daily comment limit reached'
                    : 'Write a comment...'
                  : 'Select a name before writing...'
            }
            className={cn(
              'text-foreground max-h-36 flex-1 resize-none bg-transparent pt-1 text-lg leading-6 outline-none',
              (composerLocked || post.isPending) && 'cursor-not-allowed opacity-50'
            )}
          />
          <div className='flex flex-col gap-2'>
            <button
              type='button'
              onClick={submit}
              disabled={!selectedName || !body.trim() || composerLocked || post.isPending}
              className='bg-primary text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'
              aria-label='Post comment'
            >
              <ReplyArrowIcon />
            </button>
            {body.length > 0 && (
              <div className='text-neutral flex items-center justify-between text-sm'>
                <span>
                  {body.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedComposer
