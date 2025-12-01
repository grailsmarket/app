import { Address, Hex, toHex } from 'viem'
import { useWalletClient, usePublicClient } from 'wagmi'
import {
  ENS_HOLIDAY_REFERRER_ADDRESS,
  ENS_HOLIDAY_REGISTRAR_ADDRESS,
  ENS_PUBLIC_RESOLVER_ADDRESS,
} from '@/constants/web3/contracts'
import { ENS_HOLIDAY_REGISTRAR_ABI } from '@/constants/abi/ENSHolidayRegistrar'

type RegistrationParams = {
  label: string
  owner: Address
  duration: bigint
  secret: Hex
  resolver?: Address
  data?: Hex[]
  reverseRecord: boolean
  referrer?: Hex
}

const useRegisterDomain = () => {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const generateSecret = (): `0x${string}` => {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    return toHex(randomBytes)
  }

  const makeCommitment = async (params: RegistrationParams): Promise<Hex> => {
    if (!publicClient) throw new Error('Public client not available')

    const registrationData = {
      label: params.label,
      owner: params.owner,
      duration: params.duration,
      secret: params.secret,
      resolver: params.resolver || ENS_PUBLIC_RESOLVER_ADDRESS,
      data: params.data || ([] as `0x${string}`[]),
      reverseRecord: params.reverseRecord ? 1 : 0,
      referrer: params.referrer || ENS_HOLIDAY_REFERRER_ADDRESS,
    }

    try {
      const commitment = await publicClient.readContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'makeCommitment',
        args: [registrationData],
      })
      return commitment as Hex
    } catch (error) {
      console.error('Error making commitment:', error)
      throw error
    }
  }

  const checkAvailable = async (label: string): Promise<boolean> => {
    if (!publicClient) return false

    try {
      const available = (await publicClient.readContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'available',
        args: [label],
      })) as boolean
      return available
    } catch (error) {
      console.error('Error checking availability:', error)
      return false
    }
  }

  const getRentPrice = async (label: string, duration: bigint) => {
    if (!publicClient) return null

    try {
      const result = (await publicClient.readContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'rentPrice',
        args: [label, duration],
      })) as { base: bigint; premium: bigint }

      return {
        base: result.base,
        premium: result.premium,
        total: result.base + result.premium,
      }
    } catch (error) {
      console.error('Error getting rent price:', error)
      return null
    }
  }

  const calculateDomainPriceUSD = (name: string, years: number): number => {
    const nameLength = name.replace('.eth', '').length
    const yearlyPrice = nameLength === 3 ? 640 : nameLength === 4 ? 160 : 5
    return yearlyPrice * years
  }

  const submitCommit = async (commitmentHash: Hex) => {
    if (!walletClient) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await walletClient.writeContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'commit',
        args: [commitmentHash],
      })
      return tx
    } catch (error) {
      console.error('Error submitting commitment:', error)
      throw error
    }
  }

  const checkCommitmentAge = async (commitmentHash: Hex) => {
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

  const submitRegister = async (params: RegistrationParams, value: bigint) => {
    if (!walletClient) {
      throw new Error('Wallet not connected')
    }

    const registrationData = {
      label: params.label,
      owner: params.owner,
      duration: params.duration,
      secret: params.secret,
      resolver: params.resolver || ENS_PUBLIC_RESOLVER_ADDRESS,
      data: params.data || ([] as `0x${string}`[]),
      reverseRecord: params.reverseRecord ? 1 : 0,
      referrer: params.referrer || ENS_HOLIDAY_REFERRER_ADDRESS,
    }

    try {
      const tx = await walletClient.writeContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'register',
        args: [registrationData],
        value,
      })
      return tx
    } catch (error) {
      console.error('Error registering name:', error)
      throw error
    }
  }

  return {
    generateSecret,
    makeCommitment,
    checkAvailable,
    getRentPrice,
    calculateDomainPriceUSD,
    submitCommit,
    checkCommitmentAge,
    getCommitmentAges,
    submitRegister,
  }
}

export default useRegisterDomain
