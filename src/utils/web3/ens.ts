import { createPublicClient, hexToBigInt, labelhash } from 'viem'
import { activeChain, activeChainSlug } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { normalizeName } from '@/lib/ens'
import { transports } from '@/lib/wagmi'

export const resolveEnsAddress = async (name: string) => {
  try {
    const publicClient = createPublicClient({
      chain: activeChain,
      transport: transports[activeChain.id],
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
  return `${config.ensMetadataUrl}/${activeChainSlug}/${type}/${name}`
}

export const getNameTokenId = (name: string) => hexToBigInt(labelhash(name.replace(/\.eth$/i, ''))).toString()
