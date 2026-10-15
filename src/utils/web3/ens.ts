import { createPublicClient, hexToBigInt, labelhash } from 'viem'
import { mainnet } from 'viem/chains'
import { config } from '@/lib/config'
import { normalizeName } from '@/lib/ens'
import { transports } from '@/lib/wagmi'

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
  return `${config.ensMetadataUrl}/mainnet/${type}/${name}`
}

export const getNameTokenId = (name: string) => hexToBigInt(labelhash(name.replace(/\.eth$/i, ''))).toString()
