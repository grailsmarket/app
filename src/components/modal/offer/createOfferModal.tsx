'use client'

import { useMemo, useState } from 'react'
import { MarketplaceDomainType } from '@/types/domains'
import DatePicker from '@/components/ui/datepicker'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import WrappedEtherIcon from 'public/tokens/weth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import FilterSelector from '@/components/filters/components/FilterSelector'
import Image from 'next/image'
import OpenSeaIcon from 'public/logos/opensea.svg'
import GrailsIcon from 'public/logo.svg'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DAY_IN_SECONDS } from '@/constants/time'
import useModifyCart from '@/hooks/useModifyCart'
import { useSeaportContext } from '@/context/seaport'
import { activeChain } from '@/constants/web3/chain'
import { useAccount, useBalance } from 'wagmi'
import { parseUnits } from 'viem'
import { WETH_ADDRESS, USDC_ADDRESS, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import ClaimPoap from '../poap/claimPoap'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useAppSelector } from '@/state/hooks'
import { beautifyName } from '@/lib/ens'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import Calendar from 'public/icons/calendar.svg'
import { track } from '@/lib/analytics'
import { config } from '@/lib/config'
import useETHPrice from '@/hooks/useETHPrice'
import { cn } from '@/utils/tailwind'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import type { SeaportProgressEvent } from '@/lib/seaport/seaportClient'
import {
  EMPTY_RUN,
  applySeaportProgress,
  formatDaysUntil,
  getErrorParts,
  getRunOrder,
  marketplaceLabel,
  type SeaportRun,
} from '../listing/seaport-progress'
import {
  BusyView,
  CloseFooter,
  ErrorView,
  NameSubject,
  RetryFooter,
  SubjectAmount,
  SuccessView,
  getBusyHint,
} from '../listing/seaport-views'
import { getMakeOfferBusyScreen, getMakeOfferPartial } from './offer-screens'
import useMaliciousApprovals from '@/hooks/useMaliciousApprovals'
import RevokeApprovalsNotice from '@/components/compromised/revokeApprovalsNotice'
import { isBlockedByCompromise } from '@/utils/compromised'

interface CreateOfferModalProps {
  onClose: () => void
  domain: MarketplaceDomainType | null
}

type OfferStatus = 'review' | 'submitting' | 'success' | 'error'

const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ onClose, domain }) => {
  const { modifyCart } = useModifyCart()
  const { createOffer, isLoading } = useSeaportContext()
  const { address } = useAccount()
  const { ethPrice } = useETHPrice()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [currency, setCurrency] = useState<'WETH' | 'USDC'>('WETH')
  const [price, setPrice] = useState<number | ''>('')
  const [status, setStatus] = useState<OfferStatus>('review')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  // What the Seaport client reported: per-marketplace approval and signature, then each API save
  const [run, setRun] = useState<SeaportRun>(EMPTY_RUN)

  // Stolen names only accept offers from the original owner; unsafe exploit approvals must be revoked first
  const isCompromiseBlocked = isBlockedByCompromise(domain?.compromised, address)
  const approvalCheck = useMaliciousApprovals()

  const currentTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const [expiryDate, setExpiryDate] = useState<number>(currentTimestamp + DAY_IN_SECONDS * 7)
  const durationOptions: DropdownOption[] = [
    { value: currentTimestamp + DAY_IN_SECONDS, label: '1 Day' },
    { value: currentTimestamp + DAY_IN_SECONDS * 7, label: '1 Week' },
    { value: currentTimestamp + DAY_IN_SECONDS * 30, label: '1 Month' },
    { value: currentTimestamp + DAY_IN_SECONDS * 90, label: '3 Months' },
    { value: 0, label: 'Custom' },
  ]
  const currencyOptions: DropdownOption[] = [
    { value: 'WETH', label: 'WETH (Wrapped Ether)', icon: WrappedEtherIcon },
    { value: 'USDC', label: 'USDC (USD Coin)', icon: UsdcIcon },
  ]

  // Get token balances
  const { data: wethBalance } = useBalance({
    address,
    token: WETH_ADDRESS as `0x${string}`,
    chainId: activeChain.id,
  })

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS as `0x${string}`,
    chainId: activeChain.id,
  })

  // Check if user has sufficient balance
  const hasSufficientBalance = useMemo(() => {
    if (!price) return true // No price entered yet

    const selectedBalance = currency === 'WETH' ? wethBalance : usdcBalance
    if (!selectedBalance) return false

    const decimals = TOKEN_DECIMALS[currency]
    const priceInWei = parseUnits(price.toString(), decimals)

    return selectedBalance.value >= priceInWei
  }, [price, currency, wethBalance, usdcBalance])

  // Get the current balance formatted
  const currentBalanceFormatted = useMemo(() => {
    const selectedBalance = currency === 'WETH' ? wethBalance : usdcBalance
    if (!selectedBalance) return '0'

    const decimals = TOKEN_DECIMALS[currency]
    const balance = Number(selectedBalance.value) / Math.pow(10, decimals)
    return balance.toFixed(6)
  }, [currency, wethBalance, usdcBalance])

  if (!domain) return null

  const ensName = beautifyName(domain.name)
  const { id: domainId, token_id: tokenId, owner: currentOwner } = domain

  const showError = (err: unknown, fallback: string) => {
    const { message, details } = getErrorParts(err, fallback)
    setError(message)
    setErrorDetails(details)
    setStatus('error')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorDetails(null)
    setRun(EMPTY_RUN)

    if (isCompromiseBlocked || approvalCheck.blocksTrading) return

    if (!currentOwner) {
      console.error('Domain is not registered')
      showError('Domain is not registered', 'Domain is not registered')
      return
    }

    if (!price) {
      console.error('Price is required')
      showError('Price is required', 'Price is required')
      return
    }

    if (expiryDate === 0) {
      console.error('Expiry date is required')
      showError('Expiry date is required', 'Expiry date is required')
      return
    }

    if (selectedMarketplace.length === 0) {
      console.error('Please select a marketplace')
      showError('Please select a marketplace', 'Please select a marketplace')
      return
    }

    setStatus('submitting')

    try {
      await createOffer({
        tokenId: tokenId.toString(),
        ensName,
        version: domain.version,
        price,
        currency,
        expiryDate,
        currentOwner,
        ensNameId: domainId,
        marketplace: selectedMarketplace,
        onProgress: (event: SeaportProgressEvent) => setRun((current) => applySeaportProgress(current, event)),
      })

      setRun((current) => ({ ...current, publish: 'done' }))
      setStatus('success')

      track('offer_created', {
        name: ensName,
        currency,
        amount: price,
        expiry: expiryDate,
        marketplaces: selectedMarketplace,
      })

      const cartDomain =
        cartRegisteredDomains.find((cartDomain) => cartDomain.token_id === domain.token_id) ||
        cartUnregisteredDomains.find((cartDomain) => cartDomain.token_id === domain.token_id)
      if (cartDomain) {
        modifyCart({ domain: cartDomain, inCart: true, cartType: cartDomain.cartType })
      }
    } catch (err) {
      console.error('Failed to create offer:', err)
      showError(err, 'Failed to create offer')
    }
  }

  const isBusy = status === 'submitting'
  const showPoapClaim = status === 'success' && config.canClaimPoap && !poapClaimed
  const isDatePickerOpen = status === 'review' && expiryDate === 0 && showDatePicker
  const runOrder = getRunOrder(selectedMarketplace)
  const label = selectedMarketplace.length > 0 ? marketplaceLabel(selectedMarketplace) : null
  const durationText = expiryDate > 0 ? formatDaysUntil(expiryDate) : null
  const amountLabel = price ? `${Number(price).toLocaleString('en-US', { maximumFractionDigits: 6 })} ${currency}` : ''
  const usdValue = price ? (currency === 'USDC' ? Number(price) : Number(price) * ethPrice) : null

  const busyScreen = isBusy ? getMakeOfferBusyScreen({ run, marketplaces: runOrder, currency, amountLabel }) : null

  const renderReviewForm = () => (
    <div className='space-y-3'>
      <div className='flex w-full items-center justify-between gap-2'>
        <p className='font-sedan-sc text-2xl'>Name</p>
        <p className='max-w-2/3 truncate font-semibold'>{ensName}</p>
      </div>
      <div className='border-tertiary p-md flex flex-col gap-1 rounded-md border'>
        <label className='p-md mb-2 block pb-0 text-xl font-medium'>Marketplace</label>
        <div className='flex flex-col gap-0.5'>
          <div
            onClick={() => {
              setSelectedMarketplace(
                selectedMarketplace.includes('grails')
                  ? selectedMarketplace.filter((marketplace) => marketplace !== 'grails')
                  : [...selectedMarketplace, 'grails']
              )
            }}
            className='p-md hover:bg-secondary flex w-full cursor-pointer items-center justify-between rounded-md transition-colors'
          >
            <div className='flex items-center gap-2'>
              <Image src={GrailsIcon} alt='Grails' width={24} height={24} />
              <p className='font-sedan-sc text-2xl'>Grails</p>
            </div>
            <FilterSelector
              onClick={() =>
                setSelectedMarketplace(
                  selectedMarketplace.includes('grails')
                    ? selectedMarketplace.filter((marketplace) => marketplace !== 'grails')
                    : [...selectedMarketplace, 'grails']
                )
              }
              isActive={selectedMarketplace.includes('grails')}
            />
          </div>
          <div
            onClick={() => {
              setSelectedMarketplace(
                selectedMarketplace.includes('opensea')
                  ? selectedMarketplace.filter((marketplace) => marketplace !== 'opensea')
                  : [...selectedMarketplace, 'opensea']
              )
            }}
            className='hover:bg-primary/10 flex w-full cursor-pointer items-center justify-between rounded-md p-2 transition-colors'
          >
            <div className='flex items-center gap-2'>
              <Image src={OpenSeaIcon} alt='OpenSea' width={24} height={24} />
              <p className='text-xl font-bold'>OpenSea</p>
            </div>
            <FilterSelector
              onClick={() =>
                setSelectedMarketplace(
                  selectedMarketplace.includes('opensea')
                    ? selectedMarketplace.filter((marketplace) => marketplace !== 'opensea')
                    : [...selectedMarketplace, 'opensea']
                )
              }
              isActive={selectedMarketplace.includes('opensea')}
            />
          </div>
        </div>
      </div>

      <div className='z-20 flex flex-col gap-2'>
        <Dropdown
          label='Duration'
          placeholder='Select a duration'
          options={durationOptions}
          value={expiryDate}
          onSelect={(value) => {
            setExpiryDate(Number(value))
            if (Number(value) === 0) setShowDatePicker(true)
          }}
        />
        <button
          onClick={() => {
            setExpiryDate(0)
            setShowDatePicker(true)
          }}
          className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
        >
          <p>Select a custom date</p>
          <Image src={Calendar} alt='calendar' width={18} height={18} />
        </button>
      </div>

      <div className='z-0'>
        <Dropdown
          label='Currency'
          options={currencyOptions}
          value={currency}
          onSelect={(value) => setCurrency(value as 'WETH' | 'USDC')}
        />
      </div>

      <div>
        <Input
          type='number'
          label='Price'
          value={price}
          onChange={(e) => {
            const value = e.target.value
            if (value === '') setPrice('')
            else if (Number(value) > parseFloat(currentBalanceFormatted)) setPrice(parseFloat(currentBalanceFormatted))
            else setPrice(Number(value))
          }}
          placeholder='0.1'
          min={0}
          step={0.001}
          max={parseFloat(currentBalanceFormatted)}
        />
        <div className='py-sm px-md mt-1 flex items-center justify-between'>
          <p className='text-md text-gray-400'>
            Balance: {currentBalanceFormatted} {currency}
          </p>
          <button
            className='flex items-center justify-center text-sm font-bold'
            onClick={() => setPrice(parseFloat(currentBalanceFormatted))}
          >
            Max Offer
          </button>
        </div>
      </div>

      <div className='text-center text-sm text-gray-400'>
        By making an offer, you&apos;re committing to purchase this NFT if the seller accepts. The offer will be signed
        with your wallet.
      </div>

      {isCompromiseBlocked && (
        <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
          <p className='text-md text-red-400'>
            This name was reported stolen. Only the original owner can make offers on it.
          </p>
        </div>
      )}

      {!isCompromiseBlocked && <RevokeApprovalsNotice approvalCheck={approvalCheck} />}

    </div>
  )

  const getModalContent = () => {
    if (busyScreen) return <BusyView screen={busyScreen} />

    switch (status) {
      case 'success':
        if (showPoapClaim) return <ClaimPoap />
        return <SuccessView title='Offer Created' message={`Your offer for ${ensName} is live on ${label}.`} />

      case 'error': {
        const partial = getMakeOfferPartial(run, runOrder)
        if (partial) {
          return (
            <ErrorView
              title={partial.title}
              message={partial.message}
              warning={partial.warning}
              error={error}
              details={errorDetails}
            />
          )
        }

        return <ErrorView title='Offer Failed' error={error} details={errorDetails} />
      }

      default:
        return renderReviewForm()
    }
  }

  const getFooter = () => {
    switch (status) {
      case 'review':
        return (
          <>
            <PrimaryButton
              disabled={isLoading || !price || selectedMarketplace.length === 0 || !hasSufficientBalance}
              onClick={handleSubmit}
              className={modalPrimaryActionClassName}
            >
              {!hasSufficientBalance
                ? `Insufficient ${currency} Balance`
                : isLoading
                  ? 'Submitting Offer...'
                  : 'Make Offer'}
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className={modalActionClassName}>
              Close
            </SecondaryButton>
          </>
        )

      case 'success':
        return showPoapClaim ? null : <CloseFooter onClose={onClose} />

      case 'error':
        return <RetryFooter onRetry={() => setStatus('review')} onClose={onClose} />

      default:
        return null
    }
  }

  return (
    <ModalShell
      title={showPoapClaim ? undefined : 'Make Offer'}
      onClose={onClose}
      locked={isBusy}
      // As today: the scrim closes the form, not the success
      dismissible={(status === 'review' && !isLoading && !isDatePickerOpen) || status === 'error'}
      stageKey={isBusy ? 'progress' : showPoapClaim ? 'poap' : status}
      subject={
        showPoapClaim || status === 'review' ? null : (
          <NameSubject
            names={[
              { name: domain.name, tokenId: domain.token_id, version: domain.version, expiryDate: domain.expiry_date },
            ]}
            compact={isBusy || status === 'error'}
            meta={
              [status === 'success' && label ? `Offer on ${label}` : label, durationText].filter(Boolean).join(' · ') ||
              undefined
            }
            price={price ? <SubjectAmount>{amountLabel}</SubjectAmount> : undefined}
            priceSub={
              usdValue !== null
                ? `≈ $${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : undefined
            }
          />
        )
      }
      footer={getFooter()}
      footerHint={busyScreen ? getBusyHint(busyScreen) : undefined}
      overlay={
        isDatePickerOpen ? (
          <DatePicker
            onSelect={(timestamp) => setExpiryDate(timestamp)}
            onClose={() => {
              setShowDatePicker(false)
            }}
            className='w-full'
          />
        ) : null
      }
      className={cn(isDatePickerOpen && 'min-h-120')}
    >
      {getModalContent()}
    </ModalShell>
  )
}

export default CreateOfferModal
