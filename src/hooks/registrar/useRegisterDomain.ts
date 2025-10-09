import { useWalletClient } from 'wagmi'
import { BigNumber } from '@ethersproject/bignumber'

import { getPublicClient, getBulkRegistrarContract } from '@/app/utils/web3/web3'
import { getDomainStringId } from '@/app/utils/web3/getDomainId'

import { MarketplaceDomainType, RegistrationDomainCommitType } from '@/app/types/domains'
import { CartRegisteredDomainType, CartUnregisteredDomainType } from '@/app/state/reducers/domains/marketplaceDomains'
import { DomainsToRegisterType } from '@/app/types/web3'

import { baseRegistrarContractParams, registrarControllerContractParams } from '@/app/constants/web3/contracts'
import { YEAR_IN_SECONDS } from '@/app/constants/time'

const useRegisterDomain = () => {
  const { data: wallet } = useWalletClient()

  const bulkRegistrarContract = getBulkRegistrarContract(wallet)
  const publicClient = getPublicClient()

  const checkOnChainDomainExpirations = async (
    domains: CartUnregisteredDomainType[] | CartRegisteredDomainType[] | MarketplaceDomainType[]
  ) => {
    const expirations = await publicClient.multicall({
      contracts: domains.map((domain, i) => ({
        ...baseRegistrarContractParams,
        functionName: 'nameExpires',
        args: [getDomainStringId(domain.name_ens)],
      })),
    })

    const expirationTimestamps = expirations.map((expiration) => Number(expiration.result))
    return expirationTimestamps
  }

  const getRegistrationPriceEstimate = async (domains: CartUnregisteredDomainType[]) => {
    if (!domains) return

    const results = await publicClient.multicall({
      contracts: domains.map((domain) => ({
        ...registrarControllerContractParams,
        functionName: 'rentPrice',
        args: [domain.name_ens, (domain.registrationPeriod || 1) * YEAR_IN_SECONDS],
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
        ...registrarControllerContractParams,
        functionName: 'commitments',
        args: [secret],
      })),
    })

    const results = commitments.map((commitment) => parseInt(commitment.result as string))

    return results
  }

  const commit = async (domains: CartUnregisteredDomainType[], account: `0x${string}`, secret: `0x${string}`) => {
    const domainsToCommit: RegistrationDomainCommitType[] = domains?.map((domain) => ({
      secret,
      owner: account,
      name: domain.name_ens,
    }))

    const commitments = await bulkRegistrarContract?.read.bulkMakeCommitment([domainsToCommit])

    if (!commitments) return

    const commitment = await bulkRegistrarContract?.write.bulkCommit([commitments])

    return commitment
  }

  const register = async (domains: CartUnregisteredDomainType[], domainsToRegister: DomainsToRegisterType[]) => {
    const registrationPrice = await getRegistrationPriceEstimate(domains)

    if (!registrationPrice) return

    try {
      const registration = await bulkRegistrarContract?.write.bulkRegister([domainsToRegister], {
        value: registrationPrice.toBigInt(),
      })

      return registration
    } catch (e: any) {
      console.error(e)
      return false
    }
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
