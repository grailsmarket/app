import { isAddressEqual, type Address, type Hex } from 'viem'
import type { V2RegistrationSnapshot } from '@/types/registration'

export function assertRegistrationSnapshot(
  snapshot: V2RegistrationSnapshot,
  chainId: number,
  sender: Address,
  registrar: Address
) {
  if (
    snapshot.version !== 1 ||
    snapshot.chainId !== chainId ||
    !isAddressEqual(snapshot.sender, sender) ||
    !isAddressEqual(snapshot.registrar, registrar)
  )
    throw new Error('Reconnect the wallet and network that created this commitment to continue registration.')
}

export const commitmentArguments = (snapshot: V2RegistrationSnapshot, index: number, secret: Hex) => {
  const entry = snapshot.names[index]
  if (!entry) throw new Error('The saved registration entry is missing. Do not reveal with different parameters.')
  if (!/^[0-9]+$/.test(entry.duration) || BigInt(entry.duration) >= BigInt(2) ** BigInt(64))
    throw new Error('Invalid saved registration duration.')
  return [
    entry.label,
    snapshot.owner,
    secret,
    snapshot.subregistry,
    snapshot.resolver,
    BigInt(entry.duration),
    snapshot.referrer,
  ] as const
}
