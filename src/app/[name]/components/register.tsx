import React from 'react'
import Image from 'next/image'
import Price from '@/components/ui/price'
import ENS_LOGO from 'public/logos/ens.svg'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
import PrimaryButton from '@/components/ui/buttons/primary'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import useETHPrice from '@/hooks/useETHPrice'
import { GRACE_PERIOD, PREMIUM } from '@/constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '@/constants/time'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { useAppDispatch } from '@/state/hooks'
import { openRegistrationModal } from '@/state/reducers/registration'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'

interface RegisterProps {
  nameDetails?: MarketplaceDomainType
  registrationStatus: RegistrationStatus
}

const Register: React.FC<RegisterProps> = ({ nameDetails, registrationStatus }) => {
  const { ethPrice } = useETHPrice()
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()

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
  const price = nameDetails ? calculateRegistrationPrice(nameDetails.name, ethPrice || 0).usd : 0

  if (registrationStatus === PREMIUM) {
    const expireTime = nameDetails?.expiry_date ? new Date(nameDetails.expiry_date).getTime() / 1000 : 0
    const currentTime = Math.floor(new Date().getTime() / 1000)
    const registrationPrice = calculateRegistrationPrice(nameDetails?.name || '', ethPrice || 3300).usd
    const priceOracle = new PremiumPriceOracle(expireTime)
    const premiumPrice = Math.floor(priceOracle.getOptimalPrecisionPremiumAmount(currentTime) + registrationPrice)

    return (
      <div className='p-lg lg:p-xl bg-secondary sm:border-tertiary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
        <h3 className='font-sedan-sc text-3xl'>Premium Registration</h3>
        <div className='flex w-full flex-row items-center justify-between gap-4'>
          <Price
            price={premiumPrice}
            currencyAddress={TOKEN_ADDRESSES.ETH}
            iconSize='24px'
            fontSize='text-2xl font-bold'
          />
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
      </div>
    )
  }

  return (
    <div className='p-lg lg:p-xl bg-secondary sm:border-tertiary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
      <h3 className='font-sedan-sc text-3xl'>Register Name</h3>
      <div className='flex w-full flex-row items-center justify-between gap-4'>
        <div className='flex flex-row items-center gap-3'>
          <Image src={ENS_LOGO} alt='ENS Logo' width={32} height={32} />
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
