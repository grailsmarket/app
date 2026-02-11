import { coreEfpContracts, DEFAULT_CHAIN, efpListRegistryAbi } from 'ethereum-identity-kit'
import { createPublicClient, getContract } from 'viem'
import { transports } from './wagmi'

export const listRegistryContract = getContract({
  address: coreEfpContracts.EFPListRegistry,
  abi: efpListRegistryAbi,
  client: createPublicClient({
    chain: DEFAULT_CHAIN,
    transport: transports[DEFAULT_CHAIN.id],
  }),
})
