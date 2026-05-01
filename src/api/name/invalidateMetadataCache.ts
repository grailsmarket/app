import { normalizeName } from '@/lib/ens'

export const invalidateNameMetadataCache = async (name: string) => {
  const response = await fetch('/api/name/metadata/refresh', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: normalizeName(name) }),
  })

  if (!response.ok) {
    const result = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(result?.error || 'Failed to refresh metadata')
  }

  return response.json()
}
