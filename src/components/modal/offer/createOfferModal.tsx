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
import GrailsIcon from 'public/logo.png'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DAY_IN_SECONDS } from '@/constants/time'
import { Check } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import { useSeaportContext } from '@/context/seaport'
import { mainnet } from 'viem/chains'
import { useAccount, useBalance } from 'wagmi'
import { parseUnits } from 'viem'
import { WETH_ADDRESS, USDC_ADDRESS, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import ClaimPoap from '../poap/claimPoap'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useAppSelector } from '@/state/hooks'
import { beautifyName } from '@/lib/ens'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import Calendar from 'public/icons/calendar.svg'
import { CAN_CLAIM_POAP } from '@/constants'

interface CreateOfferModalProps {
  onClose: () => void
  domain: MarketplaceDomainType | null
}

const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ onClose, domain }) => {
  const { modifyCart } = useModifyCart()
  const { createOffer, isLoading } = useSeaportContext()
  const { address } = useAccount()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [currency, setCurrency] = useState<'WETH' | 'USDC'>('WETH')
  const [price, setPrice] = useState<number | ''>('')
  const [success, setSuccess] = useState(false)

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
    chainId: mainnet.id,
  })

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS as `0x${string}`,
    chainId: mainnet.id,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    if (!currentOwner) {
      console.error('Domain is not registered')
      return
    }

    if (!price) {
      console.error('Price is required')
      return
    }

    if (expiryDate === 0) {
      console.error('Expiry date is required')
      return
    }

    if (selectedMarketplace.length === 0) {
      console.error('Please select a marketplace')
      return
    }

    try {
      await createOffer({
        tokenId: tokenId.toString(),
        ensName,
        price,
        currency,
        expiryDate,
        currentOwner,
        ensNameId: domainId,
        marketplace: selectedMarketplace,
      })

      setSuccess(true)

      const cartDomain =
        cartRegisteredDomains.find((cartDomain) => cartDomain.token_id === domain.token_id) ||
        cartUnregisteredDomains.find((cartDomain) => cartDomain.token_id === domain.token_id)
      if (cartDomain) {
        modifyCart({ domain: cartDomain, inCart: true, cartType: cartDomain.cartType })
      }
    } catch (err) {
      console.error('Failed to create offer:', err)
    }
  }

  return (
    <div
      onClick={() => {
        if (success || isLoading) return
        onClose()
      }}
      className='fixed inset-0 z-50 flex min-h-[100dvh] w-screen items-end justify-center bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-start md:overflow-y-auto md:p-4 md:py-[5vh] starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t p-4 md:max-h-none md:max-w-md md:rounded-md md:border-2 md:p-6'
      >
        {success && CAN_CLAIM_POAP && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <h2 className='font-sedan-sc min-h-6 pb-2 text-center text-3xl'>Make Offer</h2>

            {success ? (
              <>
                <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
                  <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                    <Check className='text-background h-6 w-6' />
                  </div>
                  <div className='mb-2 text-xl font-bold'>Offer Created Successfully!</div>
                </div>
                <SecondaryButton onClick={onClose} disabled={isLoading} className='w-full'>
                  <p className='text-label text-lg font-bold'>Close</p>
                </SecondaryButton>
              </>
            ) : (
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
                  {expiryDate === 0 && showDatePicker && (
                    <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-start justify-start bg-black/40 p-3 backdrop-blur-sm md:p-6'>
                      <DatePicker
                        onSelect={(timestamp) => setExpiryDate(timestamp)}
                        onClose={() => {
                          setShowDatePicker(false)
                        }}
                        className='w-full'
                      />
                    </div>
                  )}
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
                      else if (Number(value) > parseFloat(currentBalanceFormatted))
                        setPrice(parseFloat(currentBalanceFormatted))
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
                  By making an offer, you&apos;re committing to purchase this NFT if the seller accepts. The offer will
                  be signed with your wallet.
                </div>

                <div className='flex flex-col gap-2'>
                  <PrimaryButton
                    disabled={isLoading || !price || selectedMarketplace.length === 0 || !hasSufficientBalance}
                    onClick={handleSubmit}
                    className='h-10 w-full'
                  >
                    {!hasSufficientBalance
                      ? `Insufficient ${currency} Balance`
                      : isLoading
                        ? 'Submitting Offer...'
                        : 'Make Offer'}
                  </PrimaryButton>
                  <SecondaryButton onClick={onClose} className='h-10 w-full'>
                    Close
                  </SecondaryButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CreateOfferModal
