'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { globalSearch, GlobalSearchResult } from '@/api/search/globalSearch'
import { Avatar, Cross, MagnifyingGlass } from 'ethereum-identity-kit'
import { setMarketplaceSearch } from '@/state/reducers/filters/marketplaceFilters'
import { useAppDispatch } from '@/state/hooks'
import Link from 'next/link'
import NameImage from '@/components/ui/nameImage'
import NoResults from '@/components/ui/noResults'
import { CLUB_LABELS } from '@/constants/domains/marketplaceDomains'
import { useCategories } from '@/components/filters/hooks/useCategories'
import NameLoadingRow from './components/loading-rows/nameLoadingRow'
import ClubLoadingRow from './components/loading-rows/clubLoadingRow'
import UserLoadingRow from './components/loading-rows/userLoadingRow'
import Image from 'next/image'
import { CLUB_IMAGES } from '@/app/clubs/[club]/components/clubDetails'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<GlobalSearchResult>({ domains: [], clubs: [], profiles: [] })
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setQuery('')
    setResults({ domains: [], clubs: [], profiles: [] })
    onClose()
  }

  const { categories: clubs } = useCategories()
  const debouncedQuery = useDebounce(query, 400)

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults({ domains: [], clubs: [], profiles: [] })
        return
      }

      setIsLoading(true)
      try {
        const searchResults = await globalSearch(searchQuery, clubs || [])
        setResults(searchResults)
      } catch (error) {
        console.error('Search failed:', error)
        setResults({ domains: [], clubs: [], profiles: [] })
      } finally {
        setIsLoading(false)
      }
    },
    [clubs]
  )

  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery, handleSearch])

  const handleViewAllDomains = () => {
    dispatch(setMarketplaceSearch(query))
    router.push('/marketplace')
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const isEmptyResults =
    !isLoading &&
    debouncedQuery.trim() &&
    results.domains.length === 0 &&
    results.clubs.length === 0 &&
    results.profiles.length === 0

  if (!isOpen) return null

  return (
    <div
      className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center overflow-scroll bg-black/50 px-2 py-12 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-background border-primary relative flex h-fit w-full max-w-2xl flex-col rounded-md border-2 shadow-lg'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className='border-primary/20 flex items-center gap-3 border-b p-6'>
          <MagnifyingGlass className='text-foreground/60 h-6 w-6' />
          <input
            type='text'
            placeholder='Search domains, clubs, and profiles...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='text-foreground placeholder:text-foreground/40 flex-1 bg-transparent text-2xl font-medium outline-none'
            autoFocus
          />
          {query.trim() && (
            <button
              onClick={() => setQuery('')}
              className='hover:bg-primary/10 cursor-pointer rounded-md p-1 transition-colors'
            >
              <Cross className='text-foreground/90 h-5 w-5' />
            </button>
          )}
        </div>

        {/* Results */}
        <div className='max-h-[80vh] overflow-y-auto'>
          {query.trim() && (
            <>
              {/* Domains */}
              {(isLoading || results.domains.length > 0) && (
                <div className='p-lg flex flex-col gap-1'>
                  <div className='flex items-center'>
                    <h3 className='text-foreground px-3 text-2xl font-bold'>Domains</h3>
                  </div>
                  <div className='flex flex-col'>
                    {isLoading
                      ? Array.from({ length: 5 }).map((_, index) => <NameLoadingRow key={index} />)
                      : results.domains.map((domain) => (
                          <Link
                            href={`/${domain.name}`}
                            key={domain.id}
                            onClick={handleClose}
                            className='hover:bg-primary/10 flex w-full items-center justify-between rounded-md p-3 text-left transition-colors'
                          >
                            <div className='flex w-full flex-row items-center gap-2'>
                              <NameImage
                                name={domain.name}
                                tokenId={domain.token_id}
                                expiryDate={domain.expiry_date}
                                className='h-9 w-9 rounded-sm sm:h-[34px] sm:w-[34px]'
                              />
                              <div className='flex flex-col gap-px truncate' style={{ maxWidth: 'calc(100% - 60px)' }}>
                                <div className='text-foreground truncate font-semibold'>{domain.name}</div>
                                {domain.clubs && domain.clubs.length > 0 && (
                                  <div className='text-md text-foreground/60 font-semibold'>
                                    {domain.clubs
                                      .map((club) => CLUB_LABELS[club as keyof typeof CLUB_LABELS])
                                      .join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                    <button
                      onClick={handleViewAllDomains}
                      className='text-primary hover:bg-primary/10 w-full cursor-pointer rounded-md p-3 text-left text-lg font-semibold transition-colors'
                    >
                      View all results →
                    </button>
                  </div>
                </div>
              )}

              {/* Clubs */}
              {(isLoading || results.clubs.length > 0) && (
                <div className='p-lg border-primary/20 flex flex-col gap-1 border-t'>
                  <div className='flex items-center'>
                    <h3 className='text-foreground px-3 text-2xl font-bold'>Clubs</h3>
                  </div>
                  <div className='flex flex-col'>
                    {isLoading
                      ? Array.from({ length: 3 }).map((_, index) => <ClubLoadingRow key={index} />)
                      : results.clubs.map((club) => (
                          <Link
                            key={club.name}
                            href={`/clubs/${club.name}`}
                            onClick={handleClose}
                            className='hover:bg-primary/10 flex w-full items-center justify-between rounded-md p-3 text-left transition-colors'
                          >
                            <div className='flex flex-row items-center gap-3'>
                              <Image
                                src={CLUB_IMAGES[club.name as keyof typeof CLUB_IMAGES].avatar}
                                alt={`${club.name} avatar`}
                                width={100}
                                height={100}
                                className='h-9 w-9 rounded-full object-cover'
                              />
                              <div className='flex flex-col gap-px'>
                                <div className='text-foreground font-semibold'>
                                  {CLUB_LABELS[club.name as keyof typeof CLUB_LABELS]}
                                </div>
                                <div className='text-md text-foreground/60 line-clamp-1 font-medium'>
                                  {club.description}
                                </div>
                              </div>
                            </div>
                            <div className='text-md text-neutral font-semibold'>{club.member_count} members</div>
                          </Link>
                        ))}
                  </div>
                </div>
              )}

              {/* Profiles */}
              {(isLoading || results.profiles.length > 0) && (
                <div className='p-lg border-primary/20 flex flex-col gap-1 border-t'>
                  <div className='flex items-center'>
                    <h3 className='text-foreground px-3 text-2xl font-bold'>Users</h3>
                  </div>
                  <div className='flex flex-col'>
                    {isLoading
                      ? Array.from({ length: 3 }).map((_, index) => <UserLoadingRow key={index} />)
                      : results.profiles.map((profile) => (
                          <Link
                            prefetch={true}
                            key={profile.name}
                            href={`/profile/${profile.resolvedAddress?.id || profile.name}`}
                            onClick={handleClose}
                            className='hover:bg-primary/10 flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors'
                          >
                            <Avatar
                              name={profile.name}
                              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                            />
                            <div
                              className='text-foreground flex flex-col gap-px truncate font-semibold'
                              style={{ maxWidth: 'calc(100% - 48px)' }}
                            >
                              <p className='max-w-full truncate text-lg'>{profile.name}</p>
                              {profile.resolvedAddress?.id && (
                                <p className='text-md text-foreground/60 max-w-full truncate pt-0.5'>
                                  {profile.resolvedAddress?.id}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {isEmptyResults && (
                <div className='text-foreground/60 p-6 text-center'>
                  <NoResults label={`No results found for "${query}"`} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalSearchModal
