import { type Address, type Hex, encodeAbiParameters, encodeFunctionData, keccak256, stringToHex } from 'viem'
import { ALL_ROLES } from '@/constants/ens/resolver'
import { PERMISSIONED_RESOLVER_ABI } from '@/constants/web3/abi/PermissionedResolver'

// Keep the registration default (version 0) separate from additional resolver instances.
export const newResolverVersion = () => {
  const words = crypto.getRandomValues(new Uint32Array(2))
  return (words[0] & 0x1fffff) * 0x100000000 + words[1] || 1
}

export const ownedResolverData = (owner: Address, version: bigint, calls: Hex[] = []) => {
  const resolverSalt = BigInt(
    keccak256(
      encodeAbiParameters(
        [{ type: 'bytes32' }, { type: 'address' }, { type: 'uint256' }],
        [keccak256(stringToHex('OwnedResolver')), owner, version]
      )
    )
  )

  const resolverInitData = encodeFunctionData({
    abi: PERMISSIONED_RESOLVER_ABI,
    functionName: 'initialize',
    args: [[{ account: owner, roleBitmap: ALL_ROLES }], calls],
  })

  return {
    resolverSalt,
    resolverInitData,
  }
}
