import { API_BASE_URL } from '@/constants/analytics'
import { normalizeName } from '@/lib/ens'
import { APIResponseType, RolesType } from '@/types/api'

export const fetchNameRoles = async (name: string) => {
  const response = await fetch(`${API_BASE_URL}/ens-roles/names/${normalizeName(name)}/roles`)
  const results = (await response.json()) as APIResponseType<RolesType>

  if (!results.success) {
    return null
  }

  return results.data
}
