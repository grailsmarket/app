import { ListOpType } from 'ethereum-identity-kit'
import { keccak256, toHex } from 'viem/utils'

export function generateListStorageLocationSlot() {
  const hash = keccak256(toHex(Date.now() * Math.floor(Math.random() * 1000)))
  return BigInt(hash.slice(0, 66)) & ((BigInt(1) << BigInt(255)) - BigInt(1))
}

export const splitListOps = (listOps: ListOpType[]) => {
  const splitSize = 500
  const splitListOps: ListOpType[][] = []
  for (let i = 0; i < listOps.length; i += splitSize) {
    splitListOps.push(listOps.slice(i, i + splitSize))
  }

  return splitListOps
}
