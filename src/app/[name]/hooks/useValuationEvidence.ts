import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { generateValuationEvidence, ValuationEvidenceRequestError } from '@/api/valuations/generateEvidence'
import { useUserContext } from '@/context/user'
import type {
  ValuationEvidenceRequest,
  ValuationEvidenceStreamStageEvent,
  ValuationProgressStage,
} from '@/types/valuation'

type ValuationEvidenceProgressByStage = Partial<Record<ValuationProgressStage, ValuationEvidenceStreamStageEvent>>

export function useValuationEvidence(name: string) {
  const { authStatus } = useUserContext()
  const isAuthenticated = authStatus === 'authenticated'
  const [valuationEvidenceProgress, setValuationEvidenceProgress] = useState<ValuationEvidenceStreamStageEvent | null>(
    null
  )
  const [valuationEvidenceProgressByStage, setValuationEvidenceProgressByStage] =
    useState<ValuationEvidenceProgressByStage>({})

  const mutation = useMutation({
    mutationFn: async (body: ValuationEvidenceRequest) => {
      setValuationEvidenceProgress(null)
      setValuationEvidenceProgressByStage({})

      if (!isAuthenticated) {
        throw new ValuationEvidenceRequestError('Sign in to generate valuation evidence', 401, 'UNAUTHORIZED')
      }

      return generateValuationEvidence(name, body, (event) => {
        setValuationEvidenceProgressByStage((previousProgress) => ({
          ...previousProgress,
          [event.stage]: event,
        }))

        if (event.status === 'started' || event.status === 'skipped') {
          setValuationEvidenceProgress(event)
        }
      })
    },
  })

  return {
    generateEvidence: mutation.mutate,
    generateEvidenceAsync: mutation.mutateAsync,
    valuationEvidence: mutation.data,
    valuationEvidenceError: mutation.error,
    valuationEvidenceProgress,
    valuationEvidenceProgressByStage,
    valuationEvidenceIsLoading: mutation.isPending,
    valuationEvidenceIsSuccess: mutation.isSuccess,
    loginRequired: !isAuthenticated,
  }
}
