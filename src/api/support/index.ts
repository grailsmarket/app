import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { API_URL } from '@/constants/api'
import {
  CreateTicketPayload,
  SupportTicket,
  SupportTicketDetail,
  SupportTicketStatus,
  SupportTicketsListResponse,
} from '@/types/support'

const SUPPORT_URL = `${API_URL}/support/tickets`

async function unwrap<T>(response: Response): Promise<T> {
  const json = (await response.json()) as APIResponseType<T>
  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || `Request failed with status ${response.status}`)
  }
  return json.data
}

export interface ListTicketsParams {
  status?: SupportTicketStatus
  page?: number
  limit?: number
}

export const listSupportTickets = async (
  params: ListTicketsParams = {}
): Promise<SupportTicketsListResponse> => {
  const query = new URLSearchParams()
  if (params.status) query.set('status', params.status)
  if (params.page) query.set('page', params.page.toString())
  if (params.limit) query.set('limit', params.limit.toString())

  const url = query.toString() ? `${SUPPORT_URL}?${query}` : SUPPORT_URL
  const response = await authFetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  return unwrap<SupportTicketsListResponse>(response)
}

export const getSupportTicket = async (id: number): Promise<SupportTicketDetail> => {
  const response = await authFetch(`${SUPPORT_URL}/${id}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  return unwrap<SupportTicketDetail>(response)
}

export const createSupportTicket = async (
  payload: CreateTicketPayload
): Promise<SupportTicketDetail> => {
  const response = await authFetch(SUPPORT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  return unwrap<SupportTicketDetail>(response)
}

export const postSupportMessage = async (
  id: number,
  body: string
): Promise<{ messages: SupportTicketDetail['messages'] }> => {
  const response = await authFetch(`${SUPPORT_URL}/${id}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ body }),
  })
  return unwrap<{ messages: SupportTicketDetail['messages'] }>(response)
}

export const reopenSupportTicket = async (id: number): Promise<{ ticket: SupportTicket }> => {
  const response = await authFetch(`${SUPPORT_URL}/${id}/reopen`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  return unwrap<{ ticket: SupportTicket }>(response)
}
