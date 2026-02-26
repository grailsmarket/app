type VerifyResponse = {
  success: true
  token: string
  user: {
    id: number
    address: string
    email: string
    emailVerified: boolean
    createdAt: string
    lastSignIn: string
    discord: string | null
    telegram: string | null
  }
}

export const verifySignature = async (message: string, signature: string) => {
  const response = await fetch(`/api/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, signature }),
  })

  if (!response.ok)
    return {
      success: false,
      token: null,
      user: null,
      error: 'Failed to verify signature',
    }

  const data = (await response.json()).data
  return data as VerifyResponse
}
