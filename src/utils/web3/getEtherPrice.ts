import { mainnet } from 'viem/chains'
import { createPublicClient, http } from 'viem'

import { ChainlinkABI } from '@/constants/web3/abi/ChainlinkAbi'

export const getEtherPrice = async (short?: boolean) => {
  try {
    const client = createPublicClient({
      chain: mainnet,
      transport: http(`https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_MAINNET_ALCHEMY_ID}`),
    })

    const price = await client.readContract({
      address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      abi: ChainlinkABI,
      functionName: 'latestAnswer',
    })

    return (short ? Number(price) / Math.pow(10, 8) : price) as number
  } catch (e) {
    console.error(e, 'error getting usd price oracle')
    return null
  }
}
