import { ENS_METADATA_URL } from '@/constants/ens'
import { normalizeName } from '@/lib/ens'
import { transports } from '@/lib/wagmi'
import { createPublicClient } from 'viem'
import { mainnet } from 'viem/chains'

export const resolveEnsAddress = async (name: string) => {
  try {
    const publicClient = createPublicClient({
      chain: mainnet,
      transport: transports[1],
    })
    const ensAddress = await publicClient.getEnsAddress({
      name: normalizeName(name),
    })

    return ensAddress
  } catch {
    return ''
  }
}

export const getMetadataAssetUrl = (name: string, type: 'avatar' | 'header') => {
  return `${ENS_METADATA_URL}/mainnet/${type}/${name}`
}
