import 'server-only'

import { API_URL } from '@/constants/api'
import type { AuthUserType } from '@/types/api'
import { valuationLogInfo, valuationLogWarn } from './log'

type AuthMeResponse = {
  success: boolean
  data?: AuthUserType
  error?: {
    code: string
    message: string
  }
}

export class ValuationAuthError extends Error {
  status = 401

  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'ValuationAuthError'
  }
}

export async function verifyValuationToken(
  token: string | undefined,
  logPrefix = '[valuation]'
): Promise<AuthUserType> {
  if (!token) {
    valuationLogWarn(logPrefix, 'auth verifier missing token')
    throw new ValuationAuthError()
  }

  const startedAt = performance.now()
  valuationLogInfo(logPrefix, 'auth verifier request start', { endpoint: '/auth/me' })
  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  })

  const data = (await response.json().catch(() => null)) as AuthMeResponse | null
  valuationLogInfo(logPrefix, 'auth verifier response', {
    status: response.status,
    success: data?.success === true,
    elapsedMs: Math.round(performance.now() - startedAt),
  })

  if (response.status === 401 || response.status === 403) {
    throw new ValuationAuthError(data?.error?.message || 'Unauthorized')
  }

  if (!response.ok) {
    throw new Error(`Auth verification failed: ${response.status}`)
  }

  if (!data?.success || !data.data) {
    throw new ValuationAuthError('Unauthorized')
  }

  valuationLogInfo(logPrefix, 'auth verifier user resolved', { userId: data.data.id, address: data.data.address })
  return data.data
}
