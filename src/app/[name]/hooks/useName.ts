import { fetchNameDetails } from '@/api/name/details'
import { fetchNameMetadata, formatNameMetadata } from '@/api/name/metadata'
import { fetchNameOffers } from '@/api/name/offers'
import { fetchNameRoles } from '@/api/name/roles'
import { ONE_MINUTE } from '@/constants/time'
import { useAppDispatch } from '@/state/hooks'
import {
  setEditRecordsModalMetadata,
  setEditRecordsModalName,
  setEditRecordsModalOpen,
} from '@/state/reducers/modals/editRecordsModal'
import { useQuery } from '@tanstack/react-query'

const HYDRATED_STALE_TIME = 3 * ONE_MINUTE * 1000

export const useName = (name: string) => {
  const { data: nameDetails, isLoading: nameDetailsIsLoading } = useQuery({
    queryKey: ['name', 'details', name],
    queryFn: async () => {
      const details = await fetchNameDetails(name)
      return details
    },
    enabled: !!name,
    staleTime: HYDRATED_STALE_TIME,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  })

  const { data: nameOffers, isLoading: nameOffersIsLoading } = useQuery({
    queryKey: ['name', 'offers', name],
    queryFn: async () => {
      const offers = await fetchNameOffers(name)
      return offers
    },
    enabled: !!name,
    staleTime: HYDRATED_STALE_TIME,
    refetchOnWindowFocus: true,
  })

  const { data: metadata, isLoading: isMetadataLoading } = useQuery({
    queryKey: ['name', 'metadata', name],
    queryFn: async () => {
      const result = await fetchNameMetadata(name)
      return formatNameMetadata(result)
    },
    enabled: !!name,
    staleTime: HYDRATED_STALE_TIME,
  })

  const { data: roles, isLoading: isRolesLoading } = useQuery({
    queryKey: ['name', 'roles', name],
    queryFn: async () => {
      const details = await fetchNameRoles(name)
      return details
    },
    enabled: !!name,
    staleTime: HYDRATED_STALE_TIME,
  })

  const dispatch = useAppDispatch()
  const openEditMetadataModal = () => {
    if (!metadata) return
    const metadataRecord = metadata.reduce(
      (acc, row) => {
        acc[row.label] = row.value
        return acc
      },
      {} as Record<string, string>
    )
    dispatch(setEditRecordsModalName(name))
    dispatch(setEditRecordsModalMetadata(metadataRecord))
    dispatch(setEditRecordsModalOpen(true))
  }

  return {
    nameDetails,
    nameDetailsIsLoading,
    nameOffers,
    nameOffersIsLoading,
    metadata,
    isMetadataLoading,
    roles,
    isRolesLoading,
    openEditMetadataModal,
  }
}
