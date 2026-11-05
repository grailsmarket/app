import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { CompromiseIncidentType } from '@/types/domains'

export const fetchCompromiseIncidents = async (): Promise<CompromiseIncidentType[]> => {
  const response = await fetch(`${API_URL}/compromised-names/incidents`)
  const data = (await response.json()) as APIResponseType<{ incidents: CompromiseIncidentType[] }>
  if (!data.success) throw new Error(data.error?.message || 'Failed to fetch incidents')
  return data.data.incidents
}
