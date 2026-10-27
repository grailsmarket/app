'use client'

import { useEffect, useState } from 'react'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import DatePicker from '@/components/ui/datepicker'
import { DAY_IN_SECONDS } from '@/constants/time'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import { Avatar, fetchAccount } from 'ethereum-identity-kit'
import EthereumIcon from 'public/tokens/eth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import FilterSelector from '@/components/filters/components/FilterSelector'
import OpenSeaIcon from 'public/logos/opensea.svg'
import GrailsIcon from 'public/logo.svg'
import Image from 'next/image'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import { useSeaportContext } from '@/context/seaport'
import { cn } from '@/utils/tailwind'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ClaimPoap from '../poap/claimPoap'
import { useUserContext } from '@/context/user'
import { accountQueryKey } from '@/utils/queryKeys'
import { MAX_ETH_SUPPLY, TOKEN_DECIMALS, TOKENS } from '@/constants/web3/tokens'
import {
  setMakeListingModalCanAddDomains,
  setMakeListingModalDomains,
  setMakeListingModalPreviousListings,
} from '@/state/reducers/modals/makeListingModal'
import { clearBulkSelect, selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import Calendar from 'public/icons/calendar.svg'
import { formatUnits, isAddress } from 'viem'
import ArrowDownIcon from 'public/icons/arrow-down.svg'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDebounce } from '@/hooks/useDebounce'
import { beautifyName } from '@/lib/ens'
import useETHPrice from '@/hooks/useETHPrice'
import LoadingCell from '@/components/ui/loadingCell'
import { config } from '@/lib/config'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import {
  EMPTY_RUN,
  IDLE_CANCEL,
  applyCancelProgress,
  applySeaportProgress,
  formatDaysUntil,
  getErrorParts,
  getRunOrder,
  marketplaceLabel,
  type CancelRun,
  type SeaportRun,
} from './seaport-progress'
import {
  BusyView,
  CloseFooter,
  ErrorView,
  NameSubject,
  RetryFooter,
  SubjectAmount,
  SuccessView,
  getBusyHint,
} from './seaport-views'
import { getListingBusyScreen, getListingSuccess, getOldListingsNotCancelled } from './listing-screens'

export type ListingStatus =
  | 'review'
  | 'checking_approval'
  | 'approving'
  | 'submitting'
  | 'cancelling'
  | 'success'
  | 'error'

const currentTimestamp = Math.floor(Date.now() / 1000)

interface CreateListingModalProps {
  onClose: () => void
  domains: MarketplaceDomainType[]
  previousListings: DomainListingType[]
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose, domains, previousListings }) => {
  const dispatch = useAppDispatch()
  const { ethPrice } = useETHPrice()
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { createListing, isLoading, cancelListings } = useSeaportContext()

  const [cancelOldListings, setCancelOldListings] = useState(true)
  const [prices, setPrices] = useState<(number | '')[]>(Array(domains.length).fill(''))
  const [currencies, setCurrencies] = useState<('ETH' | 'USDC')[]>(Array(domains.length).fill('ETH'))
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  // Set when the new listings went through and only cancelling the old ones failed
  const [failedStep, setFailedStep] = useState<'cancel' | null>(null)
  const [status, setStatus] = useState<ListingStatus>('review')
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)
  // What the Seaport client reported: per-marketplace approvals and signatures, then the API save
  const [run, setRun] = useState<SeaportRun>(EMPTY_RUN)
  const [cancelRun, setCancelRun] = useState<CancelRun>(IDLE_CANCEL)
  const [expiryDate, setExpiryDate] = useState<number>(currentTimestamp + DAY_IN_SECONDS * 30)
  const [basePriceCurrency, setBasePriceCurrency] = useState<'ETH' | 'USDC'>('ETH')
  const [basePricePrice, setBasePricePrice] = useState<number | ''>('')
  const [showNames, setShowNames] = useState(false)

  // Broker fields
  const [brokerAddress, setBrokerAddress] = useState<string>('')
  const [brokerFeePercent, setBrokerFeePercent] = useState<number | ''>('')
  const [minBrokerFeePercent, setMinBrokerFeePercent] = useState<number>(0.0001) // Default 1%
  const [showBrokerSection, setShowBrokerSection] = useState(false)

  const debouncedBrokerAddress = useDebounce(brokerAddress, 500)

  const { data: brokerAccount, isLoading: isBrokerAccountLoading } = useQuery({
    queryKey: accountQueryKey(debouncedBrokerAddress),
    queryFn: async () => {
      if (!isAddress(debouncedBrokerAddress) && !debouncedBrokerAddress.includes('.')) return null

      const response = await fetchAccount(debouncedBrokerAddress)
      if (!isAddress(response?.address ?? '')) return null

      return response
    },
    enabled: !!debouncedBrokerAddress,
  })

  // Fetch broker fee config on mount
  useEffect(() => {
    const fetchBrokerConfig = async () => {
      try {
        const response = await fetch('/api/brokered-listings/config')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.minFeePercent) {
            setMinBrokerFeePercent(data.data.minFeePercent)
          }
        }
      } catch (err) {
        console.warn('Failed to fetch broker config, using default minimum fee:', err)
      }
    }
    fetchBrokerConfig()
  }, [])

  // Clear broker fields when Grails is deselected
  useEffect(() => {
    if (!selectedMarketplace.includes('grails')) {
      setBrokerAddress('')
      setBrokerFeePercent('')
      setShowBrokerSection(false)
    }
  }, [selectedMarketplace])

  useEffect(() => {
    domains.forEach((domain, index) => {
      const previousListing = previousListings.find((listing) =>
        listing.source === 'grails'
          ? listing.order_data.parameters.offer[0].identifierOrCriteria === domain.token_id
          : listing.order_data.protocol_data.parameters.offer[0].identifierOrCriteria === domain.token_id
      )
      if (previousListing) {
        setPrices((prev) => {
          const newPrices = [...prev]
          newPrices[index] = Number(
            formatUnits(
              BigInt(previousListing.price),
              TOKEN_DECIMALS[
                TOKENS[previousListing.currency_address as keyof typeof TOKENS] as keyof typeof TOKEN_DECIMALS
              ]
            )
          )
          return newPrices
        })
        setCurrencies((prev) => {
          const newCurrencies = [...prev]
          newCurrencies[index] = TOKENS[previousListing.currency_address as keyof typeof TOKENS] as 'ETH' | 'USDC'
          return newCurrencies
        })
      }
    })
  }, [previousListings, domains])

  if (!domains.length) return null

  const durationOptions: DropdownOption[] = [
    { value: currentTimestamp + DAY_IN_SECONDS, label: '1 Day' },
    { value: currentTimestamp + DAY_IN_SECONDS * 7, label: '1 Week' },
    { value: currentTimestamp + DAY_IN_SECONDS * 30, label: '1 Month' },
    { value: currentTimestamp + DAY_IN_SECONDS * 90, label: '3 Months' },
    { value: 0, label: 'Custom' },
  ]

  const currencyOptions: DropdownOption[] = [
    { value: 'ETH', label: 'ETH', icon: EthereumIcon },
    { value: 'USDC', label: 'USDC', icon: UsdcIcon },
  ]

  const showError = (err: unknown, fallback: string, step: 'cancel' | null = null) => {
    const { message, details } = getErrorParts(err, fallback)
    setError(message)
    setErrorDetails(details)
    setFailedStep(step)
    setStatus('error')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('checking_approval')
    setError(null)
    setErrorDetails(null)
    setFailedStep(null)
    setApproveTxHash(null)
    setRun(EMPTY_RUN)
    setCancelRun(IDLE_CANCEL)

    if (!userAddress) {
      showError('Wallet not connected', 'Wallet not connected')
      return
    }

    if (!prices.every((price) => Number(price) > 0)) {
      showError('Price is required', 'Price is required')
      return
    }

    if (expiryDate === 0) {
      showError('Please select an expiry date', 'Please select an expiry date')
      return
    }

    // Validate broker fields if broker address is provided
    if (brokerAddress.length > 0) {
      if (!isAddress(brokerAddress)) {
        if (!brokerAccount?.address) {
          showError('Invalid broker address format', 'Invalid broker address format')
          return
        }
        if (brokerAccount.address.toLowerCase() === userAddress.toLowerCase()) {
          showError('You cannot be your own broker', 'You cannot be your own broker')
          return
        }
        if (!selectedMarketplace.includes('grails')) {
          showError('Brokered listings are only available on Grails', 'Brokered listings are only available on Grails')
          return
        }
      }

      if (Number(brokerFeePercent) < minBrokerFeePercent) {
        const message = `Broker fee must be at least ${minBrokerFeePercent}%`
        showError(message, message)
        return
      }
    }

    let result: Awaited<ReturnType<typeof createListing>>

    try {
      const params: any = {
        domains,
        prices: prices.map((price) => price.toString()),
        expiryDate,
        marketplace: selectedMarketplace,
        currencies,
        setStatus,
        setApproveTxHash,
        setError,
        onProgress: (event: Parameters<typeof applySeaportProgress>[1]) =>
          setRun((current) => applySeaportProgress(current, event)),
      }

      // Add broker params if broker address is provided
      if (isAddress(brokerAccount?.address || brokerAddress) && Number(brokerFeePercent) > 0) {
        params.brokerAddress = brokerAccount?.address || brokerAddress
        params.brokerFeeBps = Math.round(Number(brokerFeePercent) * 100) // Convert percent to basis points
      }

      // console.log('Params:', params)

      result = await createListing(params)
    } catch (err) {
      // Connecting the wallet or switching its network can throw before the client's own error handling
      console.error('Failed to create listing:', err)
      showError(err, 'Failed to create listing')
      return
    }

    if (!result.success) {
      console.error('Failed to create listing:', result.error)
      showError(result.error || 'Failed to create listing', 'Failed to create listing')
      return
    }

    setRun((current) => ({ ...current, publish: 'done' }))

    if (previousListings.length > 0 && cancelOldListings) {
      setStatus('cancelling')

      try {
        const result = await cancelListings(
          previousListings.map((listing) => listing.id),
          (event) => setCancelRun((current) => applyCancelProgress(current, event))
        )
        console.log('Cancellation result:', result)
      } catch (err) {
        console.error('Failed to cancel listing:', err)
        showError(err, 'Failed to cancel listing', 'cancel')
        return
      }
    }

    setStatus('success')
    queryClient.refetchQueries({ queryKey: ['profile', 'listings'] })
    queryClient.refetchQueries({ queryKey: ['profile', 'domains'] })
  }

  // Calculate fees to show user
  const calculateFees = () => {
    if (!prices.every((price) => Number(price) > 0)) return null

    const fees: { label: string; amount: number }[] = []
    const totalPrices = prices.reduce((sum, price) => Number(sum) + Number(price), 0) as number

    if (selectedMarketplace.includes('grails')) {
      fees.push({
        label: 'Grails Fee (0%)',
        amount: prices.reduce((sum, price) => Number(sum) + Number(price) * 0.0, 0) as number,
      })
    }

    if (selectedMarketplace.includes('opensea')) {
      fees.push({
        label: 'OpenSea Fee (1%)',
        amount: prices.reduce((sum, price) => Number(sum) + Number(price) * 0.01, 0) as number,
      })
    }

    // Add broker fee if specified
    if (
      brokerAddress.length > 0 &&
      Number(brokerFeePercent) > 0 &&
      selectedMarketplace.length === 1 &&
      selectedMarketplace[0] === 'grails'
    ) {
      fees.push({
        label: `Broker Fee (${brokerFeePercent}%)`,
        amount: prices.reduce(
          (sum, price) => Number(sum) + Number(price) * (Number(brokerFeePercent) / 100),
          0
        ) as number,
      })
    }

    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
    const netProceeds = totalPrices - totalFees

    return { fees, totalFees, netProceeds }
  }

  const handleClose = () => {
    // Clear bulk selection only on success
    if (status === 'success') {
      dispatch(setMakeListingModalCanAddDomains(false))
      if (isSelecting) {
        dispatch(clearBulkSelect())
      }
    }

    // Always clear modal data when closing to prevent stale data
    dispatch(setMakeListingModalDomains([]))
    dispatch(setMakeListingModalPreviousListings([]))

    onClose()
  }

  const renderReviewForm = () => (
    <div className='flex flex-col gap-3'>
      {domains.length > 1 && (
        <div onClick={(e) => e.stopPropagation()} className='flex flex-col gap-2 rounded-md'>
          <div className='flex flex-row gap-2'>
            <div className='w-2/3'>
              <Input
                type='number'
                label='Bulk Price'
                labelClassName='w-[140px]! text-nowrap'
                value={basePricePrice}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') setBasePricePrice('')
                  else if (Number(value) > (basePriceCurrency === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY)) {
                    setBasePricePrice(basePriceCurrency === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY)
                    setPrices(
                      new Array(domains.length).fill(
                        basePriceCurrency === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY
                      )
                    )
                    setCurrencies(new Array(domains.length).fill(basePriceCurrency))
                  } else {
                    setBasePricePrice(Number(value))
                    setPrices(new Array(domains.length).fill(Number(value)))
                    setCurrencies(new Array(domains.length).fill(basePriceCurrency))
                  }
                }}
                placeholder='0.1'
                min={0}
                step={0.001}
                max={currencies[0] === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY}
              />
            </div>
            <div className='w-1/3'>
              <Dropdown
                label='Currency'
                options={currencyOptions}
                value={basePriceCurrency}
                onSelect={(value) => {
                  setBasePriceCurrency(value as 'ETH' | 'USDC')
                  setCurrencies(new Array(domains.length).fill(value))
                }}
                hideLabel={true}
              />
            </div>
          </div>
          <div className='bg-secondary border-tertiary rounded-md border p-2'>
            <p className='text-md text-neutral'>Editing the bulk price above will update all individual prices.</p>
          </div>
          {/* <SecondaryButton
                disabled={basePricePrice === '' || basePricePrice === null}
                onClick={() => {
                  setPrices(new Array(domains.length).fill(basePricePrice))
                  setCurrencies(new Array(domains.length).fill(basePriceCurrency))
                }}
                className='w-full'
              >
                Update Prices
              </SecondaryButton> */}
        </div>
      )}

      <div className='flex flex-col gap-2 rounded-md'>
        {domains.length > 1 && (
          <div
            onClick={() => setShowNames(!showNames)}
            className='bg-secondary hover:bg-tertiary border-tertiary flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors'
          >
            <p className='text-xl font-semibold'>Edit listing prices</p>
            <div className='flex items-center gap-2'>
              <p className='text-xl font-bold'>{domains.length}</p>
              <Image
                src={ArrowDownIcon}
                alt='Arrow Down'
                width={16}
                height={16}
                className={cn(showNames ? 'rotate-180' : '')}
              />
            </div>
          </div>
        )}
        {(showNames || domains.length === 1) &&
          domains.map((domain, index) => {
            return (
              <div key={domain.token_id} className={cn('flex flex-col gap-2', domains.length > 1 ? '' : '')}>
                <div className='flex w-full items-center justify-between gap-2 px-2'>
                  <p className='max-w-2/3 truncate font-semibold'>{domain.name}</p>
                </div>
                <div className='flex w-full gap-2'>
                  <div className='w-2/3'>
                    <Input
                      type='number'
                      label='Price'
                      value={prices[index]}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '')
                          setPrices((prev) => {
                            const newPrices = [...prev]
                            newPrices[index] = ''
                            return newPrices
                          })
                        else if (
                          Number(value) > (currencies[index] === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY)
                        )
                          setPrices((prev) => {
                            const newPrices = [...prev]
                            newPrices[index] = currencies[index] === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY
                            return newPrices
                          })
                        else
                          setPrices((prev) => {
                            const newPrices = [...prev]
                            newPrices[index] = Number(value)
                            return newPrices
                          })
                      }}
                      placeholder='Enter number'
                      min={0}
                      step={0.001}
                      max={currencies[0] === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY}
                    />
                  </div>
                  <div className='w-1/3'>
                    <Dropdown
                      label='Currency'
                      options={currencyOptions}
                      value={currencies[index]}
                      onSelect={(value) =>
                        setCurrencies((prev) => {
                          const newCurrencies = [...prev]
                          newCurrencies[index] = value as 'ETH' | 'USDC'
                          return newCurrencies
                        })
                      }
                      hideLabel={true}
                    />
                  </div>
                </div>
                {/* {previousListing && (
                      <>
                        <div className='flex w-full items-center justify-between gap-2'>
                          <p className='font-sedan-sc text-xl'>Price</p>
                          <Price
                            price={previousListing.price}
                            currencyAddress={previousListing.currency_address as Address}
                            fontSize='text-xl font-semibold'
                            iconSize='16px'
                            alignTooltip='right'
                          />
                        </div>
                        <div className='flex justify-between'>
                          <p className='font-sedan-sc text-xl'>Marketplace</p>
                          <div className='flex items-center gap-1'>
                            <Image
                              src={SOURCE_ICONS[previousListing.source as keyof typeof SOURCE_ICONS]}
                              alt={previousListing.source}
                              width={24}
                              height={24}
                              className='h-5 w-auto'
                            />
                            <p className='font-medium capitalize'>{previousListing.source}</p>
                          </div>
                        </div>
                        <div className='flex justify-between'>
                          <p className='font-sedan-sc text-xl'>Expiry Date</p>
                          <p className='max-w-2/3 truncate text-lg font-medium'>
                            {formatExpiryDate(previousListing.expires_at)}
                          </p>
                        </div>
                      </>
                    )} */}
              </div>
            )
          })}
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

      {/* Broker section - only show when Grails is selected */}
      {selectedMarketplace.length === 1 && selectedMarketplace[0] === 'grails' && (
        <div className='border-tertiary flex flex-col gap-0 rounded-md border p-3'>
          <div
            onClick={() => setShowBrokerSection(!showBrokerSection)}
            className='flex cursor-pointer items-center justify-between'
          >
            <div className='flex flex-col'>
              <div className='flex items-center gap-1.5 text-lg font-semibold'>
                <p>Broker</p>
                <p className='text-neutral text-md font-medium'>(Optional)</p>
              </div>
              <p className='text-neutral text-md font-medium'>Add a broker to receive a fee from this sale</p>
            </div>
            <Image
              src={ArrowDownIcon}
              alt='Arrow'
              width={16}
              height={16}
              className={cn(showBrokerSection ? 'rotate-180' : '', 'transition-transform')}
            />
          </div>

          {showBrokerSection && (
            <div className='mt-2 flex flex-col gap-2'>
              <div className='relative flex w-full flex-col gap-1.5'>
                <Input
                  type='text'
                  label='Broker Address'
                  value={brokerAddress}
                  labelClassName='min-w-[144px]!'
                  onChange={(e) => {
                    const value = e.target.value
                    setBrokerAddress(value)
                  }}
                  placeholder='ENS or Address'
                />
                {debouncedBrokerAddress.length > 0 &&
                  (isBrokerAccountLoading ? (
                    <div className='px-md flex items-center gap-1.5'>
                      <LoadingCell height='20px' width='20px' radius='10px' />
                      <LoadingCell height='16px' width='240px' radius='4px' />
                    </div>
                  ) : brokerAccount ? (
                    <div className='px-md flex items-center gap-1.5'>
                      <Avatar
                        address={brokerAccount.address}
                        name={brokerAccount.ens?.name}
                        src={brokerAccount.ens?.avatar}
                        style={{ width: 20, height: 20 }}
                      />
                      <p className='text-neutral text-md font-medium'>
                        {isAddress(brokerAddress) && brokerAccount.ens?.name
                          ? beautifyName(brokerAccount.ens?.name)
                          : brokerAccount.address || brokerAddress}
                      </p>
                    </div>
                  ) : isAddress(brokerAddress) ? null : (
                    <p className='text-md px-md font-medium text-red-400'>Invalid ENS name or Address</p>
                  ))}
              </div>

              <Input
                type='number'
                label={`Broker Fee %`}
                value={brokerFeePercent}
                labelClassName='min-w-[144px]!'
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') {
                    setBrokerFeePercent('')
                  } else {
                    const numValue = Number(value)
                    // Cap at 100%
                    setBrokerFeePercent(Math.min(numValue, 100))
                  }
                }}
                placeholder={`Enter number`}
                min={minBrokerFeePercent}
                max={100}
                step={0.1}
              />
              {brokerAddress.length > 0 &&
                Number(brokerFeePercent) > 0 &&
                Number(brokerFeePercent) < minBrokerFeePercent && (
                  <p className='text-sm text-red-400'>Broker fee must be at least {minBrokerFeePercent}%</p>
                )}

              {brokerAddress.length > 0 && Number(brokerFeePercent) > 0 && (
                <div className='bg-secondary rounded-md p-2'>
                  <p className='text-neutral text-md font-medium'>
                    The broker will get <span className='font-bold'>{brokerFeePercent}%</span> of the sale when this
                    listing is sold.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className='z-20 flex flex-col gap-2'>
        <Dropdown
          label='Duration'
          placeholder='Select a duration'
          options={durationOptions}
          value={expiryDate}
          dropdownPosition='top'
          onSelect={(value) => {
            setExpiryDate(Number(value))
            if (Number(value) === 0) setShowDatePicker(true)
          }}
        />
        {expiryDate === 0 ||
          (durationOptions.findIndex((option) => option.value === expiryDate) === -1 && (
            <p className='text-neutral text-center text-xs'>
              Duration will be set in UTC timezone, please make sure to adjust accordingly.
            </p>
          ))}
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

      {/* Cancel old listings toggle */}
      {previousListings.length > 0 && (
        <div className='border-tertiary flex items-center justify-between rounded-md border p-3'>
          <div className='flex flex-col'>
            <p className='text-lg font-medium'>Cancel old listings</p>
            <p className='text-neutral text-sm'>Cancel existing listings after creating new ones</p>
          </div>
          <button
            type='button'
            onClick={() => setCancelOldListings(!cancelOldListings)}
            className={cn(
              'group relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
              cancelOldListings ? 'bg-primary' : 'bg-tertiary'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-200',
                cancelOldListings ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      )}

      {/* Fee breakdown */}
      {prices.length === 1 && Number(prices[0]) > 0 && calculateFees() ? (
        <div className='bg-secondary border-tertiary text-md rounded-md border p-3'>
          <div className='space-y-1'>
            <div className='flex justify-between text-gray-400'>
              <p className='text-lg font-semibold'>Listing Price:</p>
              <div className='flex flex-col items-end gap-px'>
                <p className='text-lg font-semibold'>
                  {prices[0]} {currencies[0]}
                </p>
                {currencies[0] === 'ETH' && (
                  <p className='text-sm font-medium'>
                    ($
                    {(Number(prices[0]) * ethPrice).toLocaleString(navigator?.language ?? 'en-US', {
                      maximumFractionDigits: 2,
                    })}
                    )
                  </p>
                )}
              </div>
            </div>
            {calculateFees()!.fees.map((fee, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex justify-between text-lg font-medium',
                  fee.amount > 0 ? 'text-zinc-300' : 'text-green-400'
                )}
              >
                <p className='pt-px'>- {fee.label}:</p>
                <div className='flex flex-col items-end gap-px'>
                  <p>
                    {fee.amount.toFixed(currencies[0] === 'USDC' ? 2 : 4)} {currencies[0]}
                  </p>
                  {fee.amount > 0 && currencies[0] === 'ETH' && (
                    <p className='text-sm font-medium'>
                      ($
                      {(fee.amount * ethPrice).toLocaleString(navigator?.language ?? 'en-US', {
                        maximumFractionDigits: 2,
                      })}
                      )
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div className='bg-primary my-2 h-px w-full' />
            <div className='flex justify-between font-medium'>
              <p className='text-lg font-semibold'>You Receive:</p>
              <div className='flex flex-col items-end gap-px'>
                <p className='text-lg font-bold'>
                  {calculateFees()!.netProceeds.toLocaleString('default', {
                    maximumFractionDigits: 6,
                    minimumFractionDigits: 2,
                  })}{' '}
                  {currencies[0]}
                </p>
                {currencies[0] === 'ETH' && (
                  <p className='text-neutral text-sm font-medium'>
                    ($
                    {(calculateFees()!.netProceeds * ethPrice).toLocaleString(navigator?.language ?? 'en-US', {
                      maximumFractionDigits: 2,
                    })}
                    )
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )

  const isBusy =
    status === 'checking_approval' || status === 'approving' || status === 'submitting' || status === 'cancelling'
  const isEditing = previousListings.length > 0
  const showPoapClaim = status === 'success' && config.canClaimPoap && !poapClaimed
  const isDatePickerOpen = status === 'review' && expiryDate === 0 && showDatePicker
  const title = isEditing
    ? domains.length > 1
      ? 'Edit Listings'
      : 'Edit Listing'
    : domains.length > 1
      ? 'List Names'
      : 'List Name'

  const names = domains.map((domain) => beautifyName(domain.name))
  const runOrder = getRunOrder(selectedMarketplace)
  const oldListingCount = isEditing && cancelOldListings ? previousListings.length : 0
  const oldOpenSeaCount =
    oldListingCount > 0 ? previousListings.filter((listing) => listing.source === 'opensea').length : 0

  const marketplaceText = selectedMarketplace.length > 0 ? marketplaceLabel(selectedMarketplace) : null
  const durationText = expiryDate > 0 ? formatDaysUntil(expiryDate) : null
  const subjectMeta =
    status === 'success' && marketplaceText
      ? [`Listed on ${marketplaceText}`, durationText].filter(Boolean).join(' · ')
      : [marketplaceText, durationText].filter(Boolean).join(' · ')

  // The total, when every name has a price in the same currency
  const subjectPrice = (() => {
    if (!prices.every((price) => Number(price) > 0)) return null
    const currency = currencies[0]
    if (!currencies.every((entry) => entry === currency)) return null

    const total = prices.reduce<number>((sum, price) => sum + Number(price), 0)
    const usd = currency === 'USDC' ? total : ethPrice ? total * ethPrice : null

    return {
      amount: `${total.toLocaleString('en-US', { maximumFractionDigits: currency === 'USDC' ? 2 : 6 })} ${currency}`,
      usd:
        usd !== null
          ? `≈ $${usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : undefined,
    }
  })()

  const busyScreen = isBusy
    ? getListingBusyScreen({
        status,
        run,
        cancel: cancelRun,
        marketplaces: runOrder,
        names,
        oldListingCount,
        oldOpenSeaCount,
        approveTxHash,
      })
    : null

  const getModalContent = () => {
    if (busyScreen) return <BusyView screen={busyScreen} />

    switch (status) {
      case 'review':
        return renderReviewForm()

      case 'success': {
        if (showPoapClaim) return <ClaimPoap />

        const success = getListingSuccess({ names, marketplaces: selectedMarketplace, isEditing })
        return <SuccessView title={success.title} message={success.message} chips={success.chips} />
      }

      case 'error':
        if (failedStep === 'cancel') {
          const partial = getOldListingsNotCancelled({
            names,
            marketplaces: selectedMarketplace,
            cancel: cancelRun,
            oldListingCount: previousListings.length,
            oldOpenSeaCount: previousListings.filter((listing) => listing.source === 'opensea').length,
          })

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

        return <ErrorView title='Transaction Failed' error={error} details={errorDetails} />
    }
  }

  const getFooter = () => {
    switch (status) {
      case 'review':
        return (
          <>
            <PrimaryButton
              disabled={
                isLoading ||
                !prices.every((price) => Number(price) > 0) ||
                selectedMarketplace.length === 0 ||
                expiryDate < currentTimestamp ||
                !userAddress ||
                (brokerAddress.length > 0 && !(brokerAccount?.address || isAddress(brokerAddress))) ||
                (brokerAddress.length > 0 && Number(brokerFeePercent) < minBrokerFeePercent)
              }
              onClick={handleSubmit}
              className={modalPrimaryActionClassName}
            >
              {isLoading
                ? 'Submitting Listing...'
                : selectedMarketplace.length === 0
                  ? 'Select a marketplace'
                  : `List ${domains.length > 1 ? domains.length + ' Names' : domains[0].name} on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'}`}
            </PrimaryButton>
            <SecondaryButton onClick={handleClose} className={modalActionClassName}>
              Close
            </SecondaryButton>
          </>
        )

      case 'success':
        return showPoapClaim ? null : <CloseFooter onClose={handleClose} />

      case 'error':
        return <RetryFooter onRetry={() => setStatus('review')} onClose={handleClose} />

      default:
        return null
    }
  }

  return (
    <ModalShell
      title={showPoapClaim ? undefined : title}
      onClose={handleClose}
      locked={isBusy}
      dismissible={!isBusy && !isDatePickerOpen}
      stageKey={isBusy ? 'progress' : showPoapClaim ? 'poap' : status}
      subject={
        showPoapClaim || status === 'review' ? null : (
          <NameSubject
            names={domains.map((domain) => ({
              name: domain.name,
              tokenId: domain.token_id,
              version: domain.version,
              expiryDate: domain.expiry_date,
            }))}
            compact={isBusy || status === 'error'}
            meta={subjectMeta || undefined}
            price={subjectPrice ? <SubjectAmount>{subjectPrice.amount}</SubjectAmount> : undefined}
            priceSub={subjectPrice?.usd}
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
            className='w-full max-w-md'
          />
        ) : null
      }
      className={cn(isDatePickerOpen && 'min-h-120')}
    >
      {getModalContent()}
    </ModalShell>
  )
}

export default CreateListingModal
