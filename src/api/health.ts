import { API_URL } from '@/constants/api'

export const checkStatus = async () => {
  const res = await fetch(`${API_URL}/health`)

  if (!res.ok) return false

  const data = await res.json()
  return data.status === 'ok'
}
