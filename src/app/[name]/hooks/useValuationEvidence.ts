import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchCachedValuationEvidence,
  generateValuationEvidence,
  ValuationEvidenceRequestError,
} from '@/api/valuations/generateEvidence'
import { useUserContext } from '@/context/user'
import type {
  ValuationEvidenceRequest,
  ValuationEvidenceStreamStageEvent,
  ValuationProgressStage,
} from '@/types/valuation'

const DEFAULT_RECOMMENDATION_COUNT = 200
const DEFAULT_PREMIUM_FLOOR = '0.1'

type ValuationEvidenceProgressByStage = Partial<Record<ValuationProgressStage, ValuationEvidenceStreamStageEvent>>

const valuationEvidenceQueryKey = (name: string) => ['valuation-evidence', name] as const

export function useValuationEvidence(name: string) {
  const { authStatus } = useUserContext()
  const isAuthenticated = authStatus === 'authenticated'
  const queryClient = useQueryClient()
  const [valuationEvidenceProgress, setValuationEvidenceProgress] = useState<ValuationEvidenceStreamStageEvent | null>(
    null
  )
  const [valuationEvidenceProgressByStage, setValuationEvidenceProgressByStage] =
    useState<ValuationEvidenceProgressByStage>({})

  // Cancels an in-flight generation when the user navigates away / unmounts.
  const abortRef = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [name])

  // Page-load auto-fetch: unauthenticated cache "peek". Returns the cached
  // valuation to anyone (logged in or not) or null when none exists yet.
  const cachedQuery = useQuery({
    queryKey: valuationEvidenceQueryKey(name),
    queryFn: ({ signal }) => fetchCachedValuationEvidence(name, signal),
    enabled: Boolean(name),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: async () => {
      setValuationEvidenceProgress(null)
      setValuationEvidenceProgressByStage({})

      if (!isAuthenticated) {
        throw new ValuationEvidenceRequestError('Sign in to generate a valuation', 401, 'UNAUTHORIZED')
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const body: ValuationEvidenceRequest = {
        recommendationCount: DEFAULT_RECOMMENDATION_COUNT,
        premiumRegistrationFloorEth: DEFAULT_PREMIUM_FLOOR,
      }

      return generateValuationEvidence(
        name,
        body,
        (event) => {
          setValuationEvidenceProgressByStage((previousProgress) => ({
            ...previousProgress,
            [event.stage]: event,
          }))

          if (event.status === 'started' || event.status === 'skipped') {
            setValuationEvidenceProgress(event)
          }
        },
        controller.signal
      )
    },
    onSuccess: (result) => {
      // Share the fresh result with the peek cache so the other responsive
      // panel instance (and future mounts) render it without a refetch.
      queryClient.setQueryData(valuationEvidenceQueryKey(name), result)
    },
  })

  const valuationEvidence = mutation.data ?? cachedQuery.data ?? undefined

  return {
    generateEvidence: () => mutation.mutate(),
    valuationEvidence,
    valuationEvidenceError: mutation.error,
    valuationEvidenceProgress,
    valuationEvidenceProgressByStage,
    valuationEvidenceIsLoading: mutation.isPending,
    valuationEvidenceIsInitialLoading: cachedQuery.isLoading,
    hasResult: Boolean(valuationEvidence),
    loginRequired: !isAuthenticated,
  }
}
