export type DataHexString = string
export type BytesLike = string | Uint8Array

export type StoredCommitmentsType = {
  secret: `0x${string}`
  timestamp: number
  domains: string[]
}

export type DomainsToRegisterType = {
  secret: `0x${string}`
  owner: `0x${string}`
  duration: bigint
  name: string
}
