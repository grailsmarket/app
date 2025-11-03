import React from 'react'
import Image from 'next/image'
import Price from '@/components/ui/price'
import ENS_LOGO from 'public/logos/ens.svg'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
import PrimaryButton from '@/components/ui/buttons/primary'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import useETHPrice from '@/hooks/useETHPrice'
import { GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '@/constants/time'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'

interface RegisterProps {
  nameDetails?: MarketplaceDomainType
  registrationStatus: RegistrationStatus
}

const Register: React.FC<RegisterProps> = ({ nameDetails, registrationStatus }) => {
  const { ethPrice } = useETHPrice()

  if (registrationStatus === GRACE_PERIOD) {
    const expiryDateTimestamp = nameDetails?.expiry_date ? new Date(nameDetails.expiry_date).getTime() : 0
    const gracePeriodEndDate = new Date(expiryDateTimestamp + 90 * DAY_IN_SECONDS * 1000).toISOString()

    return (
      <div className='p-lg lg:p-xl border-primary bg-secondary flex w-full flex-col gap-6 rounded-lg border-2'>
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
  const price = nameDetails && ethPrice ? calculateRegistrationPrice(nameDetails.name, ethPrice).eth : 0

  return (
    <div className='p-lg lg:p-xl border-primary bg-secondary flex w-full flex-col gap-4 rounded-lg border-2'>
      <h3 className='font-sedan-sc text-3xl'>Registrater Domain</h3>
      <div className='flex w-full flex-row items-center justify-between gap-4'>
        <div className='flex flex-row items-center gap-3'>
          <Image src={ENS_LOGO} alt='ENS Logo' width={32} height={32} />
          {nameDetails?.name && (
            <Price price={price} currencyAddress={TOKEN_ADDRESSES.ETH} iconSize='24px' fontSize='text-2xl font-bold' />
          )}
        </div>
        <PrimaryButton
          onClick={() => {
            window.open(`https://app.ens.domains/${name}/register`, '_blank')
          }}
        >
          Register
        </PrimaryButton>
      </div>
    </div>
  )
}

export default Register
