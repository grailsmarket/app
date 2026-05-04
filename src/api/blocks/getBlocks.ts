import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { Block } from '@/types/chat'
import { authFetch } from '../authFetch'

/** GET /me/blocks — list the caller's blocked users. */
export const getBlocks = async (): Promise<Block[]> => {
  const response = await authFetch(`${API_URL}/me/blocks`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new Error(`Failed to fetch blocks: ${response.status}`)
  }
  const json = (await response.json()) as APIResponseType<{ blocks: Block[] }>
  return json.data.blocks
}
