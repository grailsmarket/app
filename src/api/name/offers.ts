import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { DomainOfferType } from '@/types/domains'
import { normalizeName } from '@/lib/ens'

export const fetchNameOffers = async (name: string) => {
  const response = await fetch(`${API_URL}/offers/name/${normalizeName(name)}`)
  const data = (await response.json()) as APIResponseType<{
    offers: DomainOfferType[]
  }>

  return data.data.offers
}
