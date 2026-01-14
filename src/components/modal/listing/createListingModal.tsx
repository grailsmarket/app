'use client'

import { useEffect, useState } from 'react'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import DatePicker from '@/components/ui/datepicker'
import { DAY_IN_SECONDS } from '@/constants/time'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import { Check } from 'ethereum-identity-kit'
import EthereumIcon from 'public/tokens/eth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import FilterSelector from '@/components/filters/components/FilterSelector'
import OpenSeaIcon from 'public/logos/opensea.svg'
import GrailsIcon from 'public/logo.png'
import Image from 'next/image'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import { useSeaportContext } from '@/context/seaport'
import { mainnet } from 'viem/chains'
import { cn } from '@/utils/tailwind'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ClaimPoap from '../poap/claimPoap'
import { useUserContext } from '@/context/user'
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
import { useQueryClient } from '@tanstack/react-query'
import { CAN_CLAIM_POAP } from '@/constants'

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
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { isCorrectChain, checkChain, createListing, isLoading, getCurrentChain, cancelListings } = useSeaportContext()

  const [cancelOldListings, setCancelOldListings] = useState(true)
  const [prices, setPrices] = useState<(number | '')[]>(Array(domains.length).fill(''))
  const [currencies, setCurrencies] = useState<('ETH' | 'USDC')[]>(Array(domains.length).fill('ETH'))
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ListingStatus>('review')
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)
  const [createListingTxHash, setCreateListingTxHash] = useState<string | null>(null)
  const [expiryDate, setExpiryDate] = useState<number>(currentTimestamp + DAY_IN_SECONDS * 30)
  const [basePriceCurrency, setBasePriceCurrency] = useState<'ETH' | 'USDC'>('ETH')
  const [basePricePrice, setBasePricePrice] = useState<number | ''>('')
  const [showNames, setShowNames] = useState(false)

  // Broker fields
  const [brokerAddress, setBrokerAddress] = useState<string>('')
  const [brokerFeePercent, setBrokerFeePercent] = useState<number | ''>('')
  const [minBrokerFeePercent, setMinBrokerFeePercent] = useState<number>(1) // Default 1%
  const [brokerAddressError, setBrokerAddressError] = useState<string | null>(null)
  const [showBrokerSection, setShowBrokerSection] = useState(false)

  useEffect(() => {
    getCurrentChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      setBrokerAddressError(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('checking_approval')
    setError(null)

    if (!userAddress) {
      setError('Wallet not connected')
      setStatus('error')
      return
    }

    if (!prices.every((price) => Number(price) > 0)) {
      setError('Price is required')
      setStatus('error')
      return
    }

    if (expiryDate === 0) {
      setError('Please select an expiry date')
      setStatus('error')
      return
    }

    // Validate broker fields if broker address is provided
    if (brokerAddress.trim()) {
      if (!isAddress(brokerAddress)) {
        setError('Invalid broker address format')
        setStatus('error')
        return
      }
      if (brokerAddress.toLowerCase() === userAddress.toLowerCase()) {
        setError('You cannot be your own broker')
        setStatus('error')
        return
      }
      if (Number(brokerFeePercent) < minBrokerFeePercent) {
        setError(`Broker fee must be at least ${minBrokerFeePercent}%`)
        setStatus('error')
        return
      }
      if (!selectedMarketplace.includes('grails')) {
        setError('Brokered listings are only available on Grails')
        setStatus('error')
        return
      }
    }

    try {
      const params: any = {
        domains,
        prices: prices.map((price) => price.toString()),
        expiryDate,
        marketplace: selectedMarketplace,
        currencies,
        setStatus,
        setApproveTxHash,
        setCreateListingTxHash,
        setError,
      }

      // Add broker params if broker address is provided
      if (brokerAddress.trim() && Number(brokerFeePercent) > 0) {
        params.brokerAddress = brokerAddress
        params.brokerFeeBps = Math.round(Number(brokerFeePercent) * 100) // Convert percent to basis points
      }

      const result = await createListing(params)

      if (!result.success) {
        setError(result.error || 'Failed to create listing')
        setStatus('error')
        throw new Error(result.error || 'Failed to create listing')
      }

      if (previousListings.length > 0 && cancelOldListings) {
        setStatus('cancelling')

        try {
          const result = await cancelListings(previousListings.map((listing) => listing.id))
          console.log('Cancellation result:', result)
        } catch (err) {
          setError('Failed to cancel listing')
          setStatus('error')
          throw new Error(`Failed to cancel listing: ${err}`)
        }
      }

      setStatus('success')
      queryClient.refetchQueries({ queryKey: ['profile', 'listings'] })
      queryClient.refetchQueries({ queryKey: ['profile', 'domains'] })
    } catch (err) {
      console.error('Failed to create listing:', err)
    }
  }

  // Calculate fees to show user
  const calculateFees = () => {
    if (!prices.every((price) => Number(price) > 0)) return null

    const fees: { label: string; amount: number }[] = []
    const totalPrices = prices.reduce((sum, price) => Number(sum) + Number(price), 0) as number

    if (selectedMarketplace.includes('opensea')) {
      fees.push({
        label: 'OpenSea Fee (1%)',
        amount: prices.reduce((sum, price) => Number(sum) + Number(price) * 0.01, 0) as number,
      })
    }

    if (selectedMarketplace.includes('grails')) {
      fees.push({
        label: 'Grails Fee (0%)',
        amount: prices.reduce((sum, price) => Number(sum) + Number(price) * 0.0, 0) as number,
      })
    }

    // Add broker fee if specified
    if (brokerAddress.trim() && Number(brokerFeePercent) > 0 && selectedMarketplace.includes('grails')) {
      fees.push({
        label: `Broker Fee (${brokerFeePercent}%)`,
        amount: prices.reduce((sum, price) => Number(sum) + Number(price) * (Number(brokerFeePercent) / 100), 0) as number,
      })
    }

    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
    const netProceeds = totalPrices - totalFees

    return { fees, totalFees, netProceeds }
  }

  const successMessage = () => {
    if (previousListings.length > 0) {
      return `Listings for ${domains.map((domain) => domain.name).join(', ')} were edited successfully. The new listings are now active on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'}!`
    } else {
      return `Listings for ${domains.map((domain) => domain.name).join(', ')} were listed successfully on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'}!`
    }
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

  const getModalContent = () => {
    switch (status) {
      case 'review':
        return (
          <div className='flex flex-col gap-3'>
            {domains.length > 1 && (
              <div onClick={(e) => e.stopPropagation()} className='flex flex-col gap-2 rounded-md'>
                <div className='flex flex-row gap-2'>
                  <div className='w-2/3'>
                    <Input
                      type='number'
                      label='Bulk Price'
                      value={basePricePrice}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') setBasePricePrice('')
                        else if (
                          Number(value) > (basePriceCurrency === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY)
                        ) {
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
                  <p className='text-md text-neutral'>
                    Editing the bulk price above will update all individual prices.
                  </p>
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
                                Number(value) >
                                (currencies[index] === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY)
                              )
                                setPrices((prev) => {
                                  const newPrices = [...prev]
                                  newPrices[index] =
                                    currencies[index] === 'USDC' ? Number.MAX_SAFE_INTEGER : MAX_ETH_SUPPLY
                                  return newPrices
                                })
                              else
                                setPrices((prev) => {
                                  const newPrices = [...prev]
                                  newPrices[index] = Number(value)
                                  return newPrices
                                })
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
            {selectedMarketplace.includes('grails') && (
              <div className='border-tertiary flex flex-col gap-2 rounded-md border p-3'>
                <div
                  onClick={() => setShowBrokerSection(!showBrokerSection)}
                  className='flex cursor-pointer items-center justify-between'
                >
                  <div className='flex flex-col'>
                    <p className='text-lg font-medium'>Broker (Optional)</p>
                    <p className='text-neutral text-sm'>Add a broker to receive a fee from this sale</p>
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
                  <div className='mt-2 flex flex-col gap-3'>
                    <Input
                      type='text'
                      label='Broker Address'
                      value={brokerAddress}
                      onChange={(e) => {
                        const value = e.target.value
                        setBrokerAddress(value)
                        // Validate address format in real-time
                        if (value.trim() && !isAddress(value)) {
                          setBrokerAddressError('Invalid address format')
                        } else if (value.toLowerCase() === userAddress?.toLowerCase()) {
                          setBrokerAddressError('You cannot be your own broker')
                        } else {
                          setBrokerAddressError(null)
                        }
                      }}
                      placeholder='0x...'
                    />
                    {brokerAddressError && (
                      <p className='text-sm text-red-400'>{brokerAddressError}</p>
                    )}

                    <Input
                      type='number'
                      label={`Broker Fee % (min ${minBrokerFeePercent}%)`}
                      value={brokerFeePercent}
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
                      placeholder={`${minBrokerFeePercent}`}
                      min={minBrokerFeePercent}
                      max={100}
                      step={0.1}
                    />
                    {brokerAddress.trim() && Number(brokerFeePercent) > 0 && Number(brokerFeePercent) < minBrokerFeePercent && (
                      <p className='text-sm text-red-400'>
                        Broker fee must be at least {minBrokerFeePercent}%
                      </p>
                    )}

                    {brokerAddress.trim() && Number(brokerFeePercent) > 0 && (
                      <div className='bg-secondary rounded-md p-2'>
                        <p className='text-neutral text-sm'>
                          The broker will receive {brokerFeePercent}% of the sale price when this listing is sold.
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
              {expiryDate === 0 && showDatePicker && (
                <div className='xs:p-4 fixed right-0 bottom-0 z-30 flex h-full w-full items-end justify-center bg-black/40 p-3 backdrop-blur-sm md:absolute md:p-6'>
                  <DatePicker
                    onSelect={(timestamp) => setExpiryDate(timestamp)}
                    onClose={() => {
                      setShowDatePicker(false)
                    }}
                    className='w-full max-w-md'
                  />
                </div>
              )}
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
                    <span>Listing Price:</span>
                    <span>
                      {prices[0]} {currencies[0]}
                    </span>
                  </div>
                  {calculateFees()!.fees.map((fee, idx) => (
                    <div
                      key={idx}
                      className={cn('flex justify-between', fee.amount > 0 ? 'text-red-400' : 'text-green-400')}
                    >
                      <span>- {fee.label}:</span>
                      <span>
                        {fee.amount.toFixed(currencies[0] === 'USDC' ? 2 : 4)} {currencies[0]}
                      </span>
                    </div>
                  ))}
                  <div className='bg-primary my-2 h-px w-full' />
                  <div className='flex items-center justify-between font-medium'>
                    <span>You Receive:</span>
                    <span className='text-lg font-bold'>
                      {calculateFees()!.netProceeds.toLocaleString('default', {
                        maximumFractionDigits: 6,
                        minimumFractionDigits: 2,
                      })}{' '}
                      {currencies[0]}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            <div className='flex flex-col gap-2'>
              <PrimaryButton
                disabled={
                  isLoading ||
                  !prices.every((price) => Number(price) > 0) ||
                  selectedMarketplace.length === 0 ||
                  expiryDate < currentTimestamp ||
                  !userAddress ||
                  !!brokerAddressError ||
                  (!!brokerAddress.trim() && Number(brokerFeePercent) < minBrokerFeePercent)
                }
                onClick={
                  isCorrectChain
                    ? handleSubmit
                    : (e) => checkChain({ chainId: mainnet.id, onSuccess: () => handleSubmit(e) })
                }
                className='h-10 w-full'
              >
                {isCorrectChain
                  ? isLoading
                    ? 'Submitting Listing...'
                    : selectedMarketplace.length === 0
                      ? 'Select a marketplace'
                      : `List ${domains.length > 1 ? domains.length + ' Names' : domains[0].name} on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'}`
                  : 'Switch Chain'}
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='h-10 w-full'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )

      case 'checking_approval':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Checking Approval</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>
                Checking if you have approved the NFT collection for{' '}
                {selectedMarketplace.length > 1
                  ? 'Grails and OpenSea'
                  : selectedMarketplace[0] === 'grails'
                    ? 'Grails'
                    : 'OpenSea'}
              </p>
            </div>
          </>
        )

      case 'approving':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Approving NFT Transfer</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Approving Seaport to transfer your Name</p>
              {approveTxHash && (
                <a
                  href={`https://etherscan.io/tx/${approveTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </>
        )

      case 'submitting':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Confirm in Wallet</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Submitting listing to the blockchain</p>
              {createListingTxHash && (
                <a
                  href={`https://etherscan.io/tx/${createListingTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </>
        )

      case 'cancelling':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Cancelling Old Listing</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>
                You might be asked to sign a transaction to cancel the old listing. (depends on the marketplace)
              </p>
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div className='flex flex-col items-center justify-between gap-4 py-2 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='text-xl font-bold'>{successMessage()}</div>
            </div>
            <SecondaryButton onClick={handleClose} disabled={isLoading} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        )

      case 'error':
        return (
          <>
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='mb-4 text-2xl font-bold text-red-400'>Transaction Failed</h2>
              <p className='line-clamp-6 text-red-400'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton onClick={() => setStatus('review')} className='w-full'>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div
      onClick={() => {
        if (status === 'error' || status === 'review' || status === 'success') {
          handleClose()
        }
      }}
      className='fixed inset-0 z-50 flex min-h-[100dvh] w-screen items-end justify-center bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-start md:overflow-y-auto md:p-4 md:py-[5vh] starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background p-lg sm:p-xl relative flex max-h-[calc(100dvh-70px)] w-full flex-col gap-4 overflow-y-auto border-t md:max-h-none md:max-w-md md:rounded-md md:border-2'
      >
        {status === 'success' && CAN_CLAIM_POAP && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <h2 className='font-sedan-sc min-h-6 max-w-full truncate text-center text-3xl text-white'>
              {previousListings.length > 0
                ? domains.length > 1
                  ? 'Edit Listings'
                  : 'Edit Listing'
                : domains.length > 1
                  ? 'List Names'
                  : 'List Name'}
            </h2>
            {getModalContent()}
          </>
        )}
      </div>
    </div>
  )
}

export default CreateListingModal
