export type MetaType = {
  version?: string
  timestamp: string
}

export type ErrorType = {
  code: string
  message: string
}

export type APIResponseType<T> = {
  data: T
  meta: string
  success: boolean
  error?: string
}

export type AuthUserType = {
  id: number
  address: string
  email: string | null
  emailVerified: boolean
  telegram: string | null
  discord: string | null
  createdAt: string
  lastSignIn: string
}

export type VerifyResponseType = {
  token: string
  user: AuthUserType
}

export type NonceResponseType = {
  nonce: string
  expiresAt: string
}
