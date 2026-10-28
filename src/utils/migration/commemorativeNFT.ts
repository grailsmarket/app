import { type Address, type Hex, type PublicClient, concat, encodeAbiParameters, keccak256 } from 'viem'
import { z } from 'zod'
import { COMMEMORATIVE_NFT_ABI, COMMEMORATIVE_NFT_ADDRESS } from '@/constants/web3/abi/CommemorativeNFT'

const metadataSchema = z.object({
  address: z.string(),
  token_id: z.string(),
  proof: z.array(z.string().regex(/^0x[\da-f]{64}$/i)).max(64),
  name: z.string().optional(),
})

export type CommemorativeNFT = {
  tokenId: bigint
  eligible: boolean
  proof: Hex[]
  imageUrl: string
  name: string
}

export const commemorativeNFTAssets = (owner: Address) => {
  const tokenId = BigInt(keccak256(owner))
  return { tokenId, imageUrl: `https://v2.nft-assets.ens.domains/token/${tokenId}/image.webp` }
}

export const readCommemorativeNFTClaimed = async (client: PublicClient, owner: Address) => {
  if ((await client.getChainId()) !== 1)
    throw new Error('The ENS commemorative collection is available on Ethereum mainnet.')
  return client.readContract({
    address: COMMEMORATIVE_NFT_ADDRESS,
    abi: COMMEMORATIVE_NFT_ABI,
    functionName: 'hasClaimed',
    args: [owner],
  })
}

export const readCommemorativeNFT = async (
  client: PublicClient,
  owner: Address,
  signal?: AbortSignal
): Promise<CommemorativeNFT> => {
  const [chainId, blockNumber] = await Promise.all([client.getChainId(), client.getBlockNumber({ cacheTime: 0 })])
  if (chainId !== 1) throw new Error('The ENS commemorative collection is available on Ethereum mainnet.')

  const contract = { address: COMMEMORATIVE_NFT_ADDRESS, abi: COMMEMORATIVE_NFT_ABI, blockNumber } as const
  const [baseURI, merkleRoot] = await Promise.all([
    client.readContract({ ...contract, functionName: 'baseURI' }),
    client.readContract({ ...contract, functionName: 'merkleRoot' }),
  ])
  if (baseURI !== 'https://v2.nft-assets.ens.domains/token/')
    throw new Error('The commemorative NFT metadata location has changed. Please try again later.')

  const assets = commemorativeNFTAssets(owner)
  const result: CommemorativeNFT = {
    ...assets,
    eligible: false,
    proof: [],
    name: 'ENS Commemorative',
  }
  const response = await fetch(`${baseURI}${assets.tokenId}.json`, {
    redirect: 'error',
    signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(15_000)]),
  })
  if (response.status === 404 || response.status === 410) return result
  if (!response.ok) throw new Error('Unable to check commemorative NFT eligibility. Please try again.')

  const metadata = metadataSchema.parse(await response.json())
  if (metadata.address.toLowerCase() !== owner.toLowerCase() || metadata.token_id !== assets.tokenId.toString())
    throw new Error('The commemorative NFT metadata does not match this wallet.')

  const proof = metadata.proof as Hex[]
  const leaf = keccak256(keccak256(encodeAbiParameters([{ type: 'address' }], [owner])))
  const root = proof.reduce(
    (hash, sibling) => keccak256(concat(BigInt(hash) < BigInt(sibling) ? [hash, sibling] : [sibling, hash])),
    leaf
  )
  const eligible = root.toLowerCase() === merkleRoot.toLowerCase()
  if (!eligible) throw new Error('The commemorative NFT eligibility proof could not be verified.')

  return { ...result, eligible, proof: eligible ? proof : [], name: metadata.name || result.name }
}
