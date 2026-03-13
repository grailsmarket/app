import { Address, Hex, toHex } from 'viem'
import { usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { mainnet } from 'wagmi/chains'
import {
  ENS_BULK_REGISTRAR_ADDRESS,
  ENS_HOLIDAY_REGISTRAR_ADDRESS,
  ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS,
} from '@/constants/web3/contracts'
import { BULK_REGISTRAR_ABI } from '@/constants/abi/BulkRegistrar'
import { ENS_HOLIDAY_REGISTRAR_ABI } from '@/constants/abi/ENSHolidayRegistrar'
import { ensureChain } from '@/utils/web3/ensureChain'

const useBulkRegisterDomains = () => {
  const getWalletClient = useGetWalletClient()
  const publicClient = usePublicClient({ chainId: mainnet.id })

  const generateSecret = (): Hex => {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    return toHex(randomBytes)
  }

  const checkBulkAvailable = async (labels: string[]): Promise<boolean[]> => {
    if (!publicClient) return labels.map(() => false)

    try {
      const result = await publicClient.readContract({
        address: ENS_BULK_REGISTRAR_ADDRESS,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'available',
        args: [labels],
      })
      return result as boolean[]
    } catch (error) {
      console.error('Error checking bulk availability:', error)
      return labels.map(() => false)
    }
  }

  const getBulkRentPrices = async (labels: string[], durations: bigint[]): Promise<bigint[] | null> => {
    if (!publicClient) return null

    try {
      const result = await publicClient.readContract({
        address: ENS_BULK_REGISTRAR_ADDRESS,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'rentPrices',
        args: [labels, durations],
      })
      return result as bigint[]
    } catch (error) {
      console.error('Error getting bulk rent prices:', error)
      return null
    }
  }

  const getBulkTotalPrice = async (labels: string[], durations: bigint[]): Promise<bigint | null> => {
    if (!publicClient) return null

    try {
      const result = await publicClient.readContract({
        address: ENS_BULK_REGISTRAR_ADDRESS,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'totalPrice',
        args: [labels, durations],
      })
      return result as bigint
    } catch (error) {
      console.error('Error getting bulk total price:', error)
      return null
    }
  }

  const makeBulkCommitments = async (
    labels: string[],
    owner: Address,
    durations: bigint[],
    secret: Hex,
    reverseRecord: number = 0
  ): Promise<Hex[]> => {
    if (!publicClient) throw new Error('Public client not available')

    try {
      const result = await publicClient.readContract({
        address: ENS_BULK_REGISTRAR_ADDRESS,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'makeCommitments',
        args: [
          labels,
          owner,
          durations,
          secret,
          ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS,
          labels.map(() => []) as `0x${string}`[][],
          reverseRecord,
        ],
      })
      return result as Hex[]
    } catch (error) {
      console.error('Error making bulk commitments:', error)
      throw error
    }
  }

  const submitMultiCommit = async (commitmentHashes: Hex[]): Promise<Hex> => {
    const walletClient = await getWalletClient()

    try {
      await ensureChain(walletClient, mainnet.id)

      const tx = await walletClient.writeContract({
        address: ENS_BULK_REGISTRAR_ADDRESS,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'multiCommit',
        args: [commitmentHashes],
        chain: mainnet,
      })
      return tx
    } catch (error) {
      console.error('Error submitting multi commit:', error)
      throw error
    }
  }

  const submitMultiRegister = async (
    labels: string[],
    owner: Address,
    durations: bigint[],
    secret: Hex,
    value: bigint,
    reverseRecord: number = 0
  ): Promise<Hex> => {
    const walletClient = await getWalletClient()

    try {
      await ensureChain(walletClient, mainnet.id)

      let gasLimit = BigInt(500_000) * BigInt(labels.length)

      try {
        const estimatedGas = await publicClient?.estimateContractGas({
          address: ENS_BULK_REGISTRAR_ADDRESS,
          abi: BULK_REGISTRAR_ABI,
          functionName: 'multiRegister',
          args: [
            labels,
            owner,
            durations,
            secret,
            ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS,
            labels.map(() => []) as `0x${string}`[][],
            reverseRecord,
          ],
          value,
          account: walletClient.account,
        })
        if (estimatedGas) {
          // Add 25% buffer, 50% if batch > 50 names
          const bufferMultiplier = labels.length > 50 ? BigInt(150) : BigInt(125)
          gasLimit = (estimatedGas * bufferMultiplier) / BigInt(100)
          console.log('Estimated gas:', estimatedGas.toString(), 'Using with buffer:', gasLimit.toString())
        }
      } catch (estimateError) {
        console.warn('Gas estimation failed, using fallback:', estimateError)
      }

      const tx = await walletClient.writeContract({
        address: ENS_BULK_REGISTRAR_ADDRESS,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'multiRegister',
        args: [
          labels,
          owner,
          durations,
          secret,
          ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS,
          labels.map(() => []) as `0x${string}`[][],
          reverseRecord,
        ],
        value,
        gas: gasLimit,
        chain: mainnet,
      })
      return tx
    } catch (error) {
      console.error('Error submitting multi register:', error)
      throw error
    }
  }

  const calculateDomainPriceUSD = (name: string, years: number): number => {
    const nameLength = name.replace('.eth', '').length
    const yearlyPrice = nameLength === 3 ? 640 : nameLength === 4 ? 160 : 5
    return yearlyPrice * years
  }

  const getCommitmentAges = async () => {
    if (!publicClient) return { min: 60, max: 86400 }

    try {
      const [min, max] = await Promise.all([
        publicClient.readContract({
          address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
          abi: ENS_HOLIDAY_REGISTRAR_ABI,
          functionName: 'minCommitmentAge',
        }),
        publicClient.readContract({
          address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
          abi: ENS_HOLIDAY_REGISTRAR_ABI,
          functionName: 'maxCommitmentAge',
        }),
      ])
      return { min: Number(min), max: Number(max) }
    } catch (error) {
      console.error('Error getting commitment ages:', error)
      return { min: 60, max: 86400 }
    }
  }

  const checkCommitmentAge = async (commitmentHash: Hex): Promise<number | null> => {
    if (!publicClient) return null

    try {
      const timestamp = await publicClient.readContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'commitments',
        args: [commitmentHash],
      })
      return Number(timestamp)
    } catch (error) {
      console.error('Error checking commitment:', error)
      return null
    }
  }

  return {
    generateSecret,
    checkBulkAvailable,
    getBulkRentPrices,
    getBulkTotalPrice,
    makeBulkCommitments,
    submitMultiCommit,
    submitMultiRegister,
    calculateDomainPriceUSD,
    getCommitmentAges,
    checkCommitmentAge,
  }
}

export default useBulkRegisterDomains
