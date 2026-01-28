'use client'

import React from 'react'
import Price from '@/components/ui/price'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
import PrimaryButton from '@/components/ui/buttons/primary'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import useETHPrice from '@/hooks/useETHPrice'
import { GRACE_PERIOD, PREMIUM } from '@/constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '@/constants/time'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { useAppDispatch } from '@/state/hooks'
import { openRegistrationModal } from '@/state/reducers/registration'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { usePublicClient } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { useQuery } from '@tanstack/react-query'
import { ENS_HOLIDAY_REGISTRAR_ABI } from '@/constants/abi/ENSHolidayRegistrar'
import { ENS_HOLIDAY_REGISTRAR_ADDRESS } from '@/constants/web3/contracts'
import { formatPrice } from '@/utils/formatPrice'
import PremiumPriceGraph from './PremiumPriceGraph'

interface RegisterProps {
  nameDetails?: MarketplaceDomainType
  registrationStatus: RegistrationStatus
}

const ONE_YEAR_SECONDS = BigInt(365 * 24 * 60 * 60)

const Register: React.FC<RegisterProps> = ({ nameDetails, registrationStatus }) => {
  const { ethPrice } = useETHPrice()
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const publicClient = usePublicClient({ chainId: mainnet.id })

  // Fetch rent price (including premium) directly from ENS contract
  const { data: rentPriceData, isLoading: isLoadingRentPrice } = useQuery({
    queryKey: ['rentPrice', nameDetails?.name],
    queryFn: async () => {
      if (!publicClient || !nameDetails?.name) return null

      const label = nameDetails.name.replace('.eth', '')
      const result = await publicClient.readContract({
        address: ENS_HOLIDAY_REGISTRAR_ADDRESS as `0x${string}`,
        abi: ENS_HOLIDAY_REGISTRAR_ABI,
        functionName: 'rentPrice',
        args: [label, ONE_YEAR_SECONDS],
      })

      return result as { base: bigint; premium: bigint }
    },
    enabled: !!publicClient && !!nameDetails?.name,
    refetchInterval: 10000, // Refresh every 10 seconds
    refetchOnWindowFocus: true,
    staleTime: 5000, // Consider data stale after 5 seconds
  })

  if (registrationStatus === GRACE_PERIOD) {
    const expiryDateTimestamp = nameDetails?.expiry_date ? new Date(nameDetails.expiry_date).getTime() : 0
    const gracePeriodEndDate = new Date(expiryDateTimestamp + 90 * DAY_IN_SECONDS * 1000).toISOString()

    return (
      <div className='p-lg lg:p-xl bg-secondary sm:border-tertiary flex w-full flex-col gap-6 sm:rounded-lg sm:border-2'>
        <div className='flex flex-row items-center justify-between'>
          <h3 className='font-sedan-sc text-3xl'>Grace Period</h3>
          <PrimaryButton
            onClick={() => {
              window.open(`https://app.ens.domains/${nameDetails?.name}/register`, '_blank')
            }}
          >
            View on ENS
          </PrimaryButton>
        </div>
        <p className='text-light-150 text-xl'>
          The domain is in grace period and can be registered again after{' '}
          <strong>{formatExpiryDate(gracePeriodEndDate)}</strong>
        </p>
      </div>
    )
  }

  const name = nameDetails?.name
  const baseRentPrice = rentPriceData?.base?.toString() || '0'
  const price = Math.round(Number(formatPrice(baseRentPrice, 'ETH', true)) * (ethPrice || 3000)) || 0

  if (registrationStatus === PREMIUM) {
    const premiumPriceWei = rentPriceData?.premium?.toString() || '0'

    return (
      <div className='p-lg lg:p-xl bg-secondary sm:border-tertiary flex w-full flex-col sm:rounded-lg sm:border-2'>
        <h3 className='font-sedan-sc text-3xl'>Premium Registration</h3>
        <div className='mt-4 flex w-full flex-row items-center justify-between gap-4'>
          <div className='flex flex-row items-center gap-2 text-2xl sm:text-3xl'>
            {isLoadingRentPrice ? (
              <span className='font-bold'>Loading...</span>
            ) : (
              <Price
                price={premiumPriceWei}
                currencyAddress={TOKEN_ADDRESSES.ETH}
                iconSize='28px'
                fontSize='font-bold pl-0.5'
              />
            )}
            <p className='font-bold'>+</p>
            <div className='flex flex-row items-center gap-1 font-bold'>
              <p className=''>
                ${price}&nbsp;<span className='text-neutral'>/&nbsp;yr</span>
              </p>
            </div>
          </div>
          <PrimaryButton
            onClick={() => {
              if (userAddress) {
                if (nameDetails?.name && nameDetails?.name.length > 0) {
                  dispatch(openRegistrationModal({ name: nameDetails?.name || '', domain: nameDetails }))
                } else {
                  window.open(`https://app.ens.domains/${nameDetails?.name}/register`, '_blank')
                }
              } else {
                openConnectModal?.()
              }
            }}
          >
            Register
          </PrimaryButton>
        </div>
        {nameDetails?.expiry_date && ethPrice && (
          <PremiumPriceGraph expiryDate={nameDetails.expiry_date} ethPrice={ethPrice} />
        )}
      </div>
    )
  }

  return (
    <div className='p-lg lg:p-xl bg-secondary sm:border-tertiary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
      <h3 className='font-sedan-sc text-3xl'>Register Name</h3>
      <div className='flex w-full flex-row items-center justify-between gap-4'>
        <div className='flex flex-row items-center gap-3'>
          {/* <Image src={ENS_LOGO} alt='ENS Logo' width={32} height={32} /> */}
          {nameDetails?.name && (
            <div className='flex flex-row items-center gap-1 text-3xl font-bold'>
              <p className=''>
                ${price}&nbsp;<span className='text-neutral'>/&nbsp;Year</span>
              </p>
            </div>
          )}
        </div>
        <PrimaryButton
          onClick={() => {
            if (userAddress) {
              if (name && name.length > 0) {
                dispatch(openRegistrationModal({ name: name || '', domain: nameDetails }))
              } else {
                window.open(`https://app.ens.domains/${name}/register`, '_blank')
              }
            } else {
              openConnectModal?.()
            }
          }}
        >
          Register
        </PrimaryButton>
      </div>
    </div>
  )
}

export default Register
