'use client'

import React, { useState, useCallback, useMemo } from 'react'
import Price from '@/components/ui/price'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
import PrimaryButton from '@/components/ui/buttons/primary'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import useETHPrice from '@/hooks/useETHPrice'
import { GRACE_PERIOD, PREMIUM } from '@/constants/domains/registrationStatuses'
import { getRegistrationDates } from '@/utils/getRegistrationStatus'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { openRegistrationModal, selectRegistration } from '@/state/reducers/registration'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { formatPrice } from '@/utils/formatPrice'
import PremiumPriceGraph from './PremiumPriceGraph'
import PremiumPriceControls from './PremiumPriceControls'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { config } from '@/lib/config'
import { SkeletonText } from '@/components/ui/loadingSkeleton'
import { useRegistrationPrice } from '@/hooks/registrar/useRegistrationPrice'

interface RegisterProps {
  nameDetails?: MarketplaceDomainType
  registrationStatus: RegistrationStatus
}

const Register: React.FC<RegisterProps> = ({ nameDetails, registrationStatus }) => {
  const { ethPrice } = useETHPrice()
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const registrationState = useAppSelector(selectRegistration)

  const {
    data: rentPriceData,
    isError: isRentPriceError,
    refetch: refetchRentPrice,
  } = useRegistrationPrice(
    nameDetails?.name,
    !!nameDetails?.name.endsWith('.eth') && nameDetails.name.split('.').length === 2
  )
  const useNameGracePeriod = registrationStatus === GRACE_PERIOD && !!nameDetails?.expiry_date
  const registrationExpiryDate = useNameGracePeriod
    ? nameDetails.expiry_date
    : (rentPriceData?.expiryDate ?? nameDetails?.expiry_date)
  const registrationVersion = useNameGracePeriod || !rentPriceData ? (nameDetails?.version ?? 1) : 2
  const { graceEndsAt, premiumEndsAt } = getRegistrationDates({
    ...(registrationVersion === nameDetails?.version && registrationExpiryDate === nameDetails?.expiry_date
      ? nameDetails
      : undefined),
    expiry_date: registrationExpiryDate ?? null,
    version: registrationVersion,
  })
  const hasQuote = !!rentPriceData?.isAvailable && !isRentPriceError

  // Lifted state for premium price controls
  const [priceInput, setPriceInput] = useState<string>('')
  const [targetDate, setTargetDate] = useState<Date | null>(null)

  // Create oracle instance for price/date calculations
  const oracle = useMemo(() => {
    if (!registrationExpiryDate || !graceEndsAt || !premiumEndsAt) return null
    const expiryTimestamp = Math.floor(new Date(registrationExpiryDate).getTime() / 1000)
    return new PremiumPriceOracle(expiryTimestamp, registrationVersion, { graceEndsAt, premiumEndsAt })
  }, [registrationExpiryDate, registrationVersion, graceEndsAt, premiumEndsAt])

  // Calculate target point for the graph
  const targetPoint = useMemo(() => {
    if (!targetDate || !priceInput || !ethPrice) return null
    const usd = parseFloat(priceInput)
    if (isNaN(usd) || usd <= 0) return null
    const eth = ethPrice > 0 ? usd / ethPrice : 0
    return { date: targetDate, usd, eth }
  }, [targetDate, priceInput, ethPrice])

  // Handle price input change - calculates corresponding date
  const handlePriceChange = useCallback(
    (value: string) => {
      setPriceInput(value)

      if (!oracle) return

      const price = parseFloat(value)
      if (isNaN(price) || price <= 0) {
        setTargetDate(null)
        return
      }

      const maxPremiumUsd = oracle.getPremiumUsd(oracle.releasedDate)
      if (price > maxPremiumUsd) {
        setTargetDate(null)
        return
      }

      const timestamp = oracle.getTargetDateByAmount(price)
      const date = new Date(timestamp * 1000)
      setTargetDate(date)
    },
    [oracle]
  )

  // Handle date selection - calculates corresponding price
  const handleDateChange = useCallback(
    (timestamp: number) => {
      if (!oracle || !ethPrice) return

      const date = new Date(timestamp * 1000)
      setTargetDate(date)

      const usd = oracle.getPremiumUsd(timestamp)
      setPriceInput(usd.toFixed(2))
    },
    [oracle, ethPrice]
  )

  if (registrationStatus === GRACE_PERIOD) {
    return (
      <div className='p-lg @[64rem]/app:p-xl bg-secondary @[40rem]/app:border-tertiary flex w-full flex-col gap-6 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
        <div className='flex flex-row items-center justify-between'>
          <h3 className='font-sedan-sc text-3xl'>Grace Period</h3>
          <PrimaryButton
            onClick={() => {
              window.open(
                `https://app.ens.domains/${nameDetails?.name}/register?referrer=${config.ensReferrerAddress}`,
                '_blank'
              )
            }}
          >
            View on ENS
          </PrimaryButton>
        </div>
        <p className='text-light-150 text-xl'>
          The domain is in grace period
          {graceEndsAt ? (
            <>
              {' '}
              and can be registered again after <strong>{formatExpiryDate(graceEndsAt)}</strong>
            </>
          ) : (
            '.'
          )}
        </p>
      </div>
    )
  }

  const name = nameDetails?.name
  const priceDisplay = isRentPriceError ? (
    <div className='flex flex-col gap-1 text-sm'>
      <p className='text-neutral'>Could not load registration price.</p>
      <button className='text-primary w-fit cursor-pointer hover:underline' onClick={() => void refetchRentPrice()}>
        Retry
      </button>
    </div>
  ) : !rentPriceData ? (
    <SkeletonText label='Loading registration price…' className='h-9 w-44' />
  ) : !rentPriceData.isAvailable ? (
    <p className='text-neutral text-lg'>This name is not available for registration.</p>
  ) : (
    <>
      {registrationStatus === PREMIUM && (
        <>
          <Price
            price={rentPriceData.premium.toString()}
            currencyAddress={TOKEN_ADDRESSES.USDC}
            iconSize='28px'
            fontSize='font-bold pl-0.5'
          />
          <p className='font-bold'>+</p>
        </>
      )}
      <p className='font-bold'>
        ${formatPrice(rentPriceData.base.toString(), 'USDC')}&nbsp;<span className='text-neutral'>/&nbsp;Year</span>
      </p>
    </>
  )

  if (registrationStatus === PREMIUM && rentPriceData?.isAvailable && !isRentPriceError) {
    return (
      <div className='p-lg @[64rem]/app:p-xl bg-secondary @[40rem]/app:border-tertiary flex w-full flex-col @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
        <h3 className='font-sedan-sc text-3xl'>Premium Registration</h3>
        <div className='mt-4 flex w-full flex-row items-center justify-between gap-4'>
          <div className='flex flex-row items-center gap-2 text-2xl @[40rem]/app:text-3xl'>{priceDisplay}</div>
          <div className='flex flex-row items-center gap-2'>
            <PrimaryButton
              disabled={registrationState.flowState !== 'review' || !hasQuote}
              onClick={() => {
                if (userAddress) {
                  if (nameDetails?.name && nameDetails?.name.length > 0) {
                    dispatch(openRegistrationModal({ name: nameDetails?.name || '', domain: nameDetails }))
                  } else {
                    window.open(
                      `https://app.ens.domains/${nameDetails?.name}/register?referrer=${config.ensReferrerAddress}`,
                      '_blank'
                    )
                  }
                } else {
                  openConnectModal?.()
                }
              }}
            >
              Register
            </PrimaryButton>
            {/* <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (nameDetails) toggleCart(e, nameDetails)
              }}
            >
              <CartIcon
                domain={nameDetails}
                hasBorder={true}
                className='flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-sm transition-colors @[48rem]/app:min-h-10! @[48rem]/app:min-w-10!'
              />
            </button> */}
          </div>
        </div>
        {nameDetails && registrationExpiryDate && ethPrice && oracle && (
          <>
            <PremiumPriceControls
              expiryDate={registrationExpiryDate}
              version={registrationVersion}
              graceEndsAt={graceEndsAt}
              premiumEndsAt={premiumEndsAt}
              ethPrice={ethPrice}
              domainName={nameDetails.name || ''}
              priceInput={priceInput}
              targetDate={targetDate}
              onPriceChange={handlePriceChange}
              onDateChange={handleDateChange}
            />
            <PremiumPriceGraph
              expiryDate={registrationExpiryDate}
              version={registrationVersion}
              graceEndsAt={graceEndsAt}
              premiumEndsAt={premiumEndsAt}
              ethPrice={ethPrice}
              targetPoint={targetPoint}
              onPointClick={handleDateChange}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div className='p-lg @[64rem]/app:p-xl bg-secondary @[40rem]/app:border-tertiary flex w-full flex-col gap-4 @[40rem]/app:rounded-lg @[40rem]/app:border-2'>
      <h3 className='font-sedan-sc text-3xl'>Register Name</h3>
      <div className='flex w-full flex-row items-center justify-between gap-4'>
        <div className='flex flex-row items-center gap-3'>
          {/* <Image src={ENS_LOGO} alt='ENS Logo' width={32} height={32} /> */}
          {nameDetails?.name && (
            <div className='flex flex-row items-center gap-1 text-3xl font-bold'>{priceDisplay}</div>
          )}
        </div>
        <div className='flex flex-row items-center gap-2'>
          <PrimaryButton
            disabled={registrationState.flowState !== 'review' || !hasQuote}
            onClick={() => {
              if (userAddress) {
                if (name && name.length > 0) {
                  dispatch(openRegistrationModal({ name: name || '', domain: nameDetails }))
                } else {
                  window.open(
                    `https://app.ens.domains/${name}/register?referrer=${config.ensReferrerAddress}`,
                    '_blank'
                  )
                }
              } else {
                openConnectModal?.()
              }
            }}
          >
            Register
          </PrimaryButton>
          {/* <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (nameDetails) toggleCart(e, nameDetails)
            }}
          >
            <CartIcon
              domain={nameDetails}
              hasBorder={true}
              className='flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-sm transition-colors @[48rem]/app:min-h-10! @[48rem]/app:min-w-10!'
            />
          </button> */}
        </div>
      </div>
    </div>
  )
}

export default Register
