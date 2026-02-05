import { API_BASE_URL } from '@/constants/analytics'
import { normalizeName } from '@/lib/ens'
import { APIResponseType } from '@/types/api'

export const fetchNameMetadata = async (name: string) => {
  const response = await fetch(`${API_BASE_URL}/names/${normalizeName(name)}/metadata`)
  const results = (await response.json()) as APIResponseType<{
    metadata: Record<string, any>
  }>

  if (!results.success) {
    return {}
  }

  return results.data.metadata
}
