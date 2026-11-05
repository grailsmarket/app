import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { DomainOfferOrderDataType } from '@/types/domains'
import { authFetch } from '../authFetch'

// Authenticated listing fetch. On compromised names the public API withholds order_data; it is
// only returned to a signed-in original owner / recovery wallet (or the seller).
export const fetchListingOrderData = async (listingId: number): Promise<DomainOfferOrderDataType | null> => {
  const response = await authFetch(`${API_URL}/listings/${listingId}`)
  const data = (await response.json()) as APIResponseType<{ order_data: DomainOfferOrderDataType | null }>
  if (!data.success) return null
  return data.data.order_data ?? null
}
