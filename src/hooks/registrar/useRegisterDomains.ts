import { useCallback, useState } from 'react'
import { Address, createPublicClient, erc20Abi, Hex, http, maxUint256, toHex } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { BULK_REGISTRAR_ABI } from '@/constants/web3/abi/BulkRegistrar'
import { ensureChain } from '@/utils/web3/ensureChain'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { ENS_V2_REGISTRAR } from '@/constants/web3/abi/RegistrarV2'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

const useRegisterDomains = () => {
  const getWalletClient = useGetWalletClient()
  const publicClient = createPublicClient({ chain: activeChain, transport: http() })
  const [isApproving, setIsApproving] = useState(false)
  const [approvalTxHash, setApprovalTxHash] = useState<Hex | null>(null)

  const generateSecret = (): Hex => {
    const randomBytes = new Uint8Array(32)
    crypto.getRandomValues(randomBytes)
    return toHex(randomBytes)
  }

  const checkBulkAvailable = async (labels: string[]): Promise<boolean[]> => {
    console.log(publicClient)
    if (!publicClient) return labels.map(() => false)

    try {
      const result = await publicClient.readContract({
        address: config.ensBulkRegistrar,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'available',
        args: [labels],
      })
      console.log(result)
      return result as boolean[]
    } catch (error) {
      console.error('Error checking bulk availability:', error)
      return labels.map(() => false)
    }
  }

  const getRegistrationsPrice = async (
    labels: string[],
    durations: bigint[],
    asset: Address
  ): Promise<{
    prices: readonly bigint[]
    total: bigint
  } | null> => {
    if (!publicClient) return null

    try {
      const result = await publicClient.readContract({
        address: config.ensBulkRegistrar,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'registerQuote',
        args: [labels, durations, asset],
      })

      return {
        prices: result[0],
        total: result[1],
      }
    } catch (error) {
      console.error('Error getting bulk rent prices:', error)
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
        address: config.ensBulkRegistrar,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'makeCommitments',
        args: [labels, owner, durations, secret, toHex(0, { size: 20 }), config.ensPublicResolver],
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
      await ensureChain(walletClient, activeChain.id)

      const tx = await walletClient.writeContract({
        address: config.ensBulkRegistrar,
        abi: BULK_REGISTRAR_ABI,
        functionName: 'multiCommit',
        args: [commitmentHashes],
        chain: activeChain,
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
    reverseRecord: number = 0,
    token: Address
  ): Promise<Hex> => {
    const walletClient = await getWalletClient()

    const args = {
      address: config.ensBulkRegistrar,
      abi: BULK_REGISTRAR_ABI,
      functionName: 'multiRegister',
      args: [labels, owner, durations, secret, toHex(0, { size: 20 }), config.ensPublicResolver, token, value],
      account: walletClient.account,
      chain: activeChain,
    } as const

    try {
      await ensureChain(walletClient, activeChain.id)

      const allowanceArgs = {
        address: token,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [walletClient.account.address, config.ensBulkRegistrar],
      } as const
      const allowance = await publicClient.readContract(allowanceArgs)

      if (allowance < value) {
        setApprovalTxHash(null)
        setIsApproving(true)

        try {
          const approvalTx = await walletClient.writeContract({
            address: token,
            abi: erc20Abi,
            functionName: 'approve',
            args: [config.ensBulkRegistrar, maxUint256],
            chain: activeChain,
          })
          setApprovalTxHash(approvalTx)

          const receipt = await waitForTransaction(publicClient, approvalTx)
          if (receipt.status !== 'success') throw new Error('Asset approval failed')
          if ((await publicClient.readContract(allowanceArgs)) < value)
            throw new Error('Asset allowance is insufficient')
        } finally {
          setIsApproving(false)
        }
      }

      let gasLimit = BigInt(500_000) * BigInt(labels.length)

      try {
        const estimatedGas = await publicClient?.estimateContractGas(args)
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
        ...args,
        gas: gasLimit,
        chain: activeChain,
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

  const getCommitmentAges = useCallback(async () => {
    if (!publicClient) return { min: 60, max: 86400 }

    try {
      const [min, max] = await Promise.all([
        publicClient.readContract({
          address: config.ensV2Registrar,
          abi: ENS_V2_REGISTRAR,
          functionName: 'MIN_COMMITMENT_AGE',
        }),
        publicClient.readContract({
          address: config.ensV2Registrar,
          abi: ENS_V2_REGISTRAR,
          functionName: 'MAX_COMMITMENT_AGE',
        }),
      ])
      return { min: Number(min), max: Number(max) }
    } catch (error) {
      console.error('Error getting commitment ages:', error)
      return { min: 60, max: 86400 }
    }
  }, [publicClient])

  const checkCommitmentAge = async (commitmentHash: Hex): Promise<number | null> => {
    if (!publicClient) return null

    try {
      const timestamp = await publicClient.readContract({
        address: config.ensV2Registrar,
        abi: ENS_V2_REGISTRAR,
        functionName: 'commitmentAt',
        args: [commitmentHash],
      })
      return Number(timestamp)
    } catch (error) {
      console.error('Error checking commitment:', error)
      return null
    }
  }

  return {
    isApproving,
    approvalTxHash,
    generateSecret,
    checkBulkAvailable,
    getRegistrationsPrice,
    makeBulkCommitments,
    submitMultiCommit,
    submitMultiRegister,
    calculateDomainPriceUSD,
    getCommitmentAges,
    checkCommitmentAge,
  }
}

export default useRegisterDomains
