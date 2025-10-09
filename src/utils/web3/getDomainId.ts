import { keccak256 } from 'viem'
import { BigNumber } from '@ethersproject/bignumber'
import { toUtf8Bytes } from './ethers/utf8'

export const getDomainHexId = (name: string) => {
  return BigNumber.from(keccak256(toUtf8Bytes(name))).toHexString()
}

export const getDomainStringId = (name: string) => {
  return BigNumber.from(keccak256(toUtf8Bytes(name))).toString()
}
