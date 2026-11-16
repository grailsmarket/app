import { getAddress } from 'viem'
import { config } from '@/lib/config'

export const ANNIVERSARY_NFT_ADDRESS = getAddress(config.anniversaryNftContract)
export const ANNIVERSARY_NFT_COLLECTION_URL = 'https://opensea.io/collection/grails-first-anniversary'
