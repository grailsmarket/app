export const normalizeAccountInput = (input?: string | null) => input?.trim().toLowerCase() || null

export const accountQueryKey = (input?: string | null) => ['account', normalizeAccountInput(input)] as const
