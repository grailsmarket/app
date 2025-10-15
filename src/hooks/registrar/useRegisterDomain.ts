import { useWalletClient } from 'wagmi'
import { BigNumber } from '@ethersproject/bignumber'

import { getDomainStringId } from '@/utils/web3/getDomainId'

import { MarketplaceDomainType } from '@/types/domains'
import { CartRegisteredDomainType, CartUnregisteredDomainType } from '@/state/reducers/domains/marketplaceDomains'

import { YEAR_IN_SECONDS } from '@/constants/time'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { BaseRegistrarAbi } from '@/constants/abi/BaseRegistrar'
import { ENS_REGISTRAR_ADDRESS, ENS_REGISTRAR_CONTROLLER_ADDRESS } from '@/constants/web3/contracts'
import { RegistrarControllerAbi } from '@/constants/abi/RegistrarControllerAbi'

const useRegisterDomain = () => {
  const walletClient = useWalletClient()
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(),
  })

  const checkOnChainDomainExpirations = async (
    domains: CartUnregisteredDomainType[] | CartRegisteredDomainType[] | MarketplaceDomainType[]
  ) => {
    const expirations = await publicClient.multicall({
      contracts: domains.map((domain, i) => ({
        abi: BaseRegistrarAbi,
        address: ENS_REGISTRAR_ADDRESS as `0x${string}`,
        functionName: 'nameExpires',
        args: [getDomainStringId(domain.name)],
      })),
    })

    const expirationTimestamps = expirations.map((expiration) => Number(expiration.result))
    return expirationTimestamps
  }

  const getRegistrationPriceEstimate = async (domains: CartUnregisteredDomainType[]) => {
    if (!domains) return

    const results = await publicClient.multicall({
      contracts: domains.map((domain) => ({
        abi: RegistrarControllerAbi,
        address: ENS_REGISTRAR_CONTROLLER_ADDRESS as `0x${string}`,
        functionName: 'rentPrice',
        args: [domain.name, (domain.registrationPeriod || 1) * YEAR_IN_SECONDS],
      })),
    })

    const totalPrice = results
      .map((result) =>
        BigNumber.from(result?.result || 0)
          .mul(1150)
          .div(1000)
      )
      .reduce((acc, curr) => {
        return acc.add(curr)
      }, BigNumber.from(0))

    return totalPrice
  }

  const checkCommitments = async (secrets: string[]) => {
    const commitments = await publicClient.multicall({
      contracts: secrets.map((secret) => ({
        abi: RegistrarControllerAbi,
        address: ENS_REGISTRAR_CONTROLLER_ADDRESS as `0x${string}`,
        functionName: 'commitments',
        args: [secret],
      })),
    })

    const results = commitments.map((commitment) => parseInt(commitment.result as string))

    return results
  }

  const commit = async (domain: CartUnregisteredDomainType, account: `0x${string}`, secret: `0x${string}`) => {
    const commitment = await walletClient.data?.writeContract({
      address: ENS_REGISTRAR_ADDRESS as `0x${string}`,
      abi: BaseRegistrarAbi,
      functionName: 'approve',
      args: [walletClient.data?.account.address, BigInt(domain.token_id)],
    })

    return commitment
  }

  const register = async (domain: CartUnregisteredDomainType) => {
    const registrationPrice = await getRegistrationPriceEstimate([domain])

    if (!registrationPrice) return

    // try {
    //   const registration = await walletClient.data?.writeContract({
    //     address: ENS_REGISTRAR_ADDRESS as `0x${string}`,
    //     abi: BaseRegistrarAbi,
    //     functionName: 'register',
    //     args: [],
    //   })

    //   return registration
    // } catch (e: any) {
    //   console.error(e)
    //   return false
    // }
  }

  return {
    commit,
    register,
    checkCommitments,
    getRegistrationPriceEstimate,
    checkOnChainDomainExpirations,
  }
}

export default useRegisterDomain
