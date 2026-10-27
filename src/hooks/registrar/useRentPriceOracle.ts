import { useCallback, useMemo } from 'react'
import { Address, createPublicClient, http } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { ENS_V2_REGISTRAR } from '@/constants/web3/abi/RegistrarV2'
import { STANDARD_RENT_PRICE_ORACLE_ABI } from '@/constants/web3/abi/StandardRentPriceOracle'
import { config } from '@/lib/config'
import type { RegistrationPricing } from '@/utils/registrationPricing'

export const useRentPriceOracle = () => {
  const publicClient = useMemo(() => createPublicClient({ chain: activeChain, transport: http() }), [])

  return useCallback(
    async (asset: Address): Promise<RegistrationPricing> => {
      const oracle = await publicClient.readContract({
        address: config.ensV2Registrar,
        abi: ENS_V2_REGISTRAR,
        functionName: 'rentPriceOracle',
      })
      const contract = { address: oracle, abi: STANDARD_RENT_PRICE_ORACLE_ABI }
      const [baseRates, discountPoints, discountDenominator, paymentTokenRatio] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          { ...contract, functionName: 'getBaseRates' },
          { ...contract, functionName: 'getDiscountPoints' },
          { ...contract, functionName: 'DISCOUNT_DENOMINATOR' },
          { ...contract, functionName: 'getPaymentTokenRatio', args: [asset] },
        ],
      })

      return { baseRates, discountPoints, discountDenominator, paymentTokenRatio }
    },
    [publicClient]
  )
}
