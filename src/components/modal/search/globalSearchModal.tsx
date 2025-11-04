'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { globalSearch, GlobalSearchResult } from '@/api/search/globalSearch'
import { MarketplaceDomainType, ClubType } from '@/types/domains'
import { AuthUserType } from '@/types/api'
import { Cross, MagnifyingGlass } from 'ethereum-identity-kit'
import { setMarketplaceSearch } from '@/state/reducers/filters/marketplaceFilters'
import { useAppDispatch } from '@/state/hooks'
import LoadingCell from '@/components/ui/loadingCell'

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

  const debouncedQuery = useDebounce(query, 400)

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults({ domains: [], clubs: [], profiles: [] })
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await globalSearch(searchQuery)
      setResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults({ domains: [], clubs: [], profiles: [] })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    handleSearch(debouncedQuery)
  }, [debouncedQuery, handleSearch])

  const handleDomainClick = (domain: MarketplaceDomainType) => {
    router.push(`/${domain.name}`)
    onClose()
  }

  const handleClubClick = (club: ClubType) => {
    router.push(`/clubs/${club.name}`)
    onClose()
  }

  const handleProfileClick = (profile: string) => {
    router.push(`/profile/${profile}`)
    onClose()
  }

  const handleViewAllDomains = () => {
    dispatch(setMarketplaceSearch(query))
    router.push('/marketplace')
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-start justify-center overflow-scroll bg-black/50 px-2 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background border-primary relative flex h-fit w-full max-w-2xl flex-col rounded-md border-2 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-primary/20">
          <MagnifyingGlass className="w-5 h-5 text-foreground/60" />
          <input
            type="text"
            placeholder="Search domains, clubs, and profiles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-foreground placeholder:text-foreground/40 outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary/10 rounded-md transition-colors"
          >
            <Cross className="w-5 h-5 text-foreground/60" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {!isLoading && query.trim() && (
            <>
              {/* Domains */}
              {results.domains.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-foreground">Domains</h3>
                  </div>
                  <div className="space-y-1">

                    {isLoading ?
                      <div>
                        <LoadingCell height='12px' width='100%' radius='2px' />
                        <LoadingCell height='12px' width='100%' radius='2px' />
                        <LoadingCell height='12px' width='100%' radius='2px' />
                      </div>
                      : results.domains.map((domain) => (
                        <button
                          key={domain.id}
                          onClick={() => handleDomainClick(domain)}
                          className="w-full text-left p-3 hover:bg-primary/10 rounded-md transition-colors flex items-center justify-between"
                        >
                          <div>
                            <div className="font-medium text-foreground">{domain.name}</div>
                            {domain.clubs && domain.clubs.length > 0 && (
                              <div className="text-sm text-foreground/60">
                                {domain.clubs.slice(0, 2).join(', ')}
                                {domain.clubs.length > 2 && ` +${domain.clubs.length - 2} more`}
                              </div>
                            )}
                          </div>
                          {domain.owner && (
                            <div className="text-xs text-foreground/40">
                              {domain.owner.slice(0, 6)}...{domain.owner.slice(-4)}
                            </div>
                          )}
                        </button>
                      ))}
                    <button
                      onClick={handleViewAllDomains}
                      className="w-full text-left p-3 text-primary hover:bg-primary/10 rounded-md transition-colors text-sm"
                    >
                      View all domain results →
                    </button>
                  </div>
                </div>
              )}

              {/* Clubs */}
              {results.clubs.length > 0 && (
                <div className="p-4 border-t border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-foreground">Clubs</h3>
                  </div>
                  <div className="space-y-1">
                    {results.clubs.map((club) => (
                      <button
                        key={club.name}
                        onClick={() => handleClubClick(club)}
                        className="w-full text-left p-3 hover:bg-primary/10 rounded-md transition-colors"
                      >
                        <div className="font-medium text-foreground">{club.name}</div>
                        <div className="text-sm text-foreground/60 line-clamp-1">{club.description}</div>
                        <div className="text-xs text-foreground/40 mt-1">
                          {club.member_count} members
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Profiles */}
              {results.profiles.length > 0 && (
                <div className="p-4 border-t border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-medium text-foreground">Profiles</h3>
                  </div>
                  <div className="space-y-1">
                    {results.profiles.map((profile) => (
                      <button
                        key={profile.name}
                        onClick={() => handleProfileClick(profile.resolvedAddress?.id || profile.name)}
                        className="w-full text-left p-3 hover:bg-primary/10 rounded-md transition-colors"
                      >
                        <div className="font-medium text-foreground">
                          {profile.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No results */}
              {!isLoading && query.trim() &&
                results.domains.length === 0 &&
                results.clubs.length === 0 &&
                results.profiles.length === 0 && (
                  <div className="p-6 text-center text-foreground/60">
                    No results found for &quot;{query}&quot;
                  </div>
                )}
            </>
          )}

          {/* Empty state */}
          {!query.trim() && (
            <div className="p-6 text-center text-foreground/60">
              Start typing to search domains, clubs, and profiles
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalSearchModal