'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { Avatar, Cross, MagnifyingGlass } from 'ethereum-identity-kit'
import { emptyFilterState, setMarketplaceSearch } from '@/state/reducers/filters/marketplaceFilters'
import { useAppDispatch } from '@/state/hooks'
import Link from 'next/link'
import NameImage from '@/components/ui/nameImage'
import NoResults from '@/components/ui/noResults'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { useCategories } from '@/components/filters/hooks/useCategories'
import NameLoadingRow from './components/loading-rows/nameLoadingRow'
import CategoryLoadingRow from './components/loading-rows/categoryLoadingRow'
import UserLoadingRow from './components/loading-rows/userLoadingRow'
import Image from 'next/image'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { useQuery } from '@tanstack/react-query'
import { searchProfiles } from '@/api/search-profiles'
import { cn } from '@/utils/tailwind'
import { beautifyName, normalizeName } from '@/lib/ens'
import { getCategoryDetails } from '@/utils/getCategoryDetails'

interface GlobalSearchModalProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()

  const [query, setQuery] = useState(initialQuery)
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    setIsClosing(true)
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setQuery('')
      onClose()
      setIsClosing(false)
    }, 250) // Match the duration-250 class
  }

  const { categories } = useCategories()
  const debouncedQuery = useDebounce(query, 400)

  const { data: fetchedDomains, isLoading: isFetchedDomainsLoading } = useQuery({
    queryKey: ['globalSearch', 'domains', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length === 0) return { domains: [], nextPageParam: 0, hasNextPage: false }
      const domains = await fetchDomains({
        limit: 5,
        pageParam: 1,
        filters: emptyFilterState as any,
        searchTerm: debouncedQuery,
        enableBulkSearch: true,
      })
      return domains
    },
    enabled: debouncedQuery.length >= 1,
  })

  const displayedCategories = useMemo(() => {
    if (debouncedQuery.length === 0) return []
    return (
      categories?.filter(
        (category) =>
          category.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          category.description.toLowerCase().includes(debouncedQuery.toLowerCase())
      ) || [].slice(0, 5)
    )
  }, [categories, debouncedQuery])

  const { data: fetchedProfiles, isLoading: isFetchedProfilesLoading } = useQuery({
    queryKey: ['globalSearch', 'profiles', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length === 0) return []
      const profiles = await searchProfiles({ search: debouncedQuery })
      return profiles
    },
    enabled: debouncedQuery.length >= 1,
  })

  const handleViewAllDomains = () => {
    const isBulkSearching = query.replaceAll(' ', ',').split(',').length > 1
    if (isBulkSearching) {
      const queries = query
        .replaceAll(' ', ',')
        .split(',')
        .map((query) => normalizeName(query.toLowerCase().trim()))
        .filter((query) => query.length > 2)
      dispatch(setMarketplaceSearch(queries.join(', ')))
      router.push(`/marketplace?search=${queries.join(',')}`)
      handleClose()
      return
    }

    const normalizedQuery = normalizeName(query)
    dispatch(setMarketplaceSearch(normalizedQuery))
    router.push(`/marketplace?search=${normalizedQuery}`)
    handleClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const isLoading = isFetchedDomainsLoading || isFetchedProfilesLoading

  const isEmptyResults =
    !isLoading &&
    debouncedQuery.trim() &&
    fetchedDomains?.domains.length === 0 &&
    displayedCategories.length === 0 &&
    fetchedProfiles?.length === 0

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-[100dvh] w-screen items-end justify-center overflow-scroll bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-start md:py-12 xl:items-center starting:translate-y-[100vh] md:starting:translate-y-0',
        isOpen && !isClosing ? 'translate-y-0' : 'translate-y-[100vh] md:translate-y-0'
      )}
      onClick={(e) => {
        e.stopPropagation()
        handleClose()
      }}
    >
      <div
        className='bg-background border-tertiary relative flex h-[calc(100dvh-80px)] w-full flex-col border-t shadow-lg md:h-fit md:max-w-2xl md:rounded-md md:border-2'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className='border-tertiary relative flex items-center gap-3 border-b px-4 py-5 md:p-6'>
          <MagnifyingGlass className='text-foreground/60 h-6 w-6' />
          <input
            type='text'
            placeholder='Search names, profiles, and categories...'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className='text-foreground placeholder:text-foreground/40 flex-1 bg-transparent font-medium outline-none md:text-2xl'
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClose()
              }

              if (e.key === 'Enter') {
                const isBulkSearching = query.replaceAll(' ', ',').split(',').length > 1
                if (isBulkSearching) {
                  handleViewAllDomains()
                } else {
                  const lookupQuery = query.replace('.eth', '').trim() + '.eth'
                  handleClose()
                  router.push(`/${normalizeName(lookupQuery)}`)
                }
              }
            }}
          />
          <button onClick={handleClose} className='hover:bg-primary/10 cursor-pointer rounded-md p-1 transition-colors'>
            <Cross className='text-foreground/90 h-4 w-4 md:h-5 md:w-5' />
          </button>
        </div>
        <p className='text-md text-neutral px-5 pt-3 lg:px-7'>
          <strong>Bulk Search</strong>: Input up to 2,000 terms separated by commas or spaces, then press ENTER
        </p>

        {/* Results */}
        <div className='h-[calc(100dvh-160px)] overflow-y-auto md:max-h-[75vh]'>
          {query.trim() && (
            <>
              {/* Names */}
              {(isFetchedDomainsLoading || (fetchedDomains?.domains && fetchedDomains.domains.length > 0)) && (
                <div className='p-md pt-lg md:p-lg flex flex-col gap-1'>
                  <div className='flex items-center'>
                    <h3 className='text-foreground px-3 font-bold md:text-2xl'>Names</h3>
                  </div>
                  <div className='flex flex-col'>
                    {isFetchedDomainsLoading
                      ? Array.from({ length: 5 }).map((_, index) => <NameLoadingRow key={index} />)
                      : fetchedDomains?.domains.map((domain) => (
                          <Link
                            href={`/${normalizeName(domain.name)}`}
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
                                <div className='text-foreground truncate font-semibold'>
                                  {beautifyName(domain.name)}
                                </div>
                                {domain.clubs && domain.clubs.length > 0 && (
                                  <div className='text-md text-foreground/60 font-semibold'>
                                    {domain.clubs
                                      .map((club) => CATEGORY_LABELS[club as keyof typeof CATEGORY_LABELS])
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

              {/* Categories */}
              {(isFetchedDomainsLoading || displayedCategories.length > 0) && (
                <div className='p-md pt-lg md:p-lg border-primary/20 flex flex-col gap-1 border-t'>
                  <div className='flex items-center'>
                    <h3 className='text-foreground px-3 font-bold md:text-2xl'>Categories</h3>
                  </div>
                  <div className='flex flex-col'>
                    {isFetchedDomainsLoading
                      ? Array.from({ length: 3 }).map((_, index) => <CategoryLoadingRow key={index} />)
                      : displayedCategories.map((category) => (
                          <Link
                            key={category.name}
                            href={`/categories/${category.name}`}
                            onClick={handleClose}
                            className='hover:bg-primary/10 flex w-full items-center justify-between rounded-md p-3 text-left transition-colors'
                          >
                            <div className='flex flex-row items-center gap-3'>
                              <Image
                                src={getCategoryDetails(category.name).avatar}
                                alt={`${category.name} avatar`}
                                width={100}
                                height={100}
                                className='h-9 w-9 rounded-full object-cover'
                              />
                              <div className='flex flex-col gap-px'>
                                <div className='text-foreground font-semibold'>
                                  {CATEGORY_LABELS[category.name as keyof typeof CATEGORY_LABELS]}
                                </div>
                                <div className='text-md text-foreground/60 line-clamp-1 font-medium'>
                                  {category.description}
                                </div>
                              </div>
                            </div>
                            <div className='text-md text-neutral font-semibold'>{category.member_count} names</div>
                          </Link>
                        ))}
                  </div>
                </div>
              )}

              {/* Profiles */}
              {(isFetchedProfilesLoading || (fetchedProfiles && fetchedProfiles.length > 0)) && (
                <div className='p-md pt-lg md:p-lg border-primary/20 flex flex-col gap-1 border-t'>
                  <div className='flex items-center'>
                    <h3 className='text-foreground px-3 font-bold md:text-2xl'>Users</h3>
                  </div>
                  <div className='flex flex-col'>
                    {isFetchedProfilesLoading
                      ? Array.from({ length: 3 }).map((_, index) => <UserLoadingRow key={index} />)
                      : fetchedProfiles?.map((profile) => (
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
                              <p className='max-w-full truncate text-lg'>{beautifyName(profile.name)}</p>
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
                  <NoResults label={`No results found for "${query}"`} height='400px' />
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
