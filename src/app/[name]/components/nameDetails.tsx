'use client'

import Image from 'next/image'
import React, { ReactNode, useState } from 'react'
import { Address, numberToHex } from 'viem'
import LoadingCell from '@/components/ui/loadingCell'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import User from '@/components/ui/user'
import CopyIcon from 'public/icons/copy.svg'
import CheckIcon from 'public/icons/check.svg'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import {
  PREMIUM,
  GRACE_PERIOD,
  UNREGISTERED,
  REGISTERED_STATUSES,
  REGISTERABLE_STATUSES,
} from '@/constants/domains/registrationStatuses'
import Price from '@/components/ui/price'
import { beautifyName } from '@/lib/ens'
import NameImage from '@/components/ui/nameImage'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import Link from 'next/link'
import { CATEGORY_IMAGES } from '@/app/categories/[category]/components/categoryDetails'
import PrimaryButton from '@/components/ui/buttons/primary'
import { useAppDispatch } from '@/state/hooks'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import { setTransferModalDomains, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { cn } from '@/utils/tailwind'
import { convertWeiPrice } from '@/utils/convertWeiPrice'
import useETHPrice from '@/hooks/useETHPrice'
import { useExpiryCountdown } from '@/hooks/useExpiryCountdown'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { useRouter } from 'next/navigation'
import ENS_LOGO from 'public/logos/ens-circle.svg'
import OPENSEA_LOGO from 'public/logos/opensea.svg'
import ENSVISION_LOGO from 'public/logos/ensvision.svg'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'
import { ENS_NAME_WRAPPER_ADDRESS, ENS_REGISTRAR_ADDRESS } from '@/constants/web3/contracts'
import { useQuery } from '@tanstack/react-query'
import Tooltip from '@/components/ui/tooltip'
import { DAY_IN_SECONDS } from '@/constants/time'
import KeywordMetrics from './keywordMetrics'

type Row = {
  label: string
  value: string | number | ReactNode | null | undefined
  canCopy: boolean
}

interface NameDetailsProps {
  name: string
  nameDetails?: MarketplaceDomainType | null
  nameDetailsIsLoading: boolean
  registrationStatus: RegistrationStatus
  isSubname: boolean
}

const NameDetails: React.FC<NameDetailsProps> = ({
  name,
  nameDetails,
  nameDetailsIsLoading,
  registrationStatus,
  isSubname,
}) => {
  const [isOwnerCopied, setIsOwnerCopied] = useState(false)
  const [isOwnerAddressCopied, setIsOwnerAddressCopied] = useState(false)
  const router = useRouter()
  const { ethPrice } = useETHPrice()

  // Determine countdown type based on registration status
  const countdownType =
    registrationStatus === PREMIUM ? 'premium' : registrationStatus === GRACE_PERIOD ? 'grace' : null
  const { timeLeftString } = useExpiryCountdown(nameDetails?.expiry_date ?? null, countdownType)
  const { data: isWrapped } = useQuery({
    queryKey: ['isWrapped', name],
    queryFn: () => checkIfWrapped(name),
  })

  const rows: Row[] = [
    {
      label: 'Name',
      value: nameDetails?.name ? beautifyName(nameDetails.name) : name,
      canCopy: true,
    },
    {
      label: REGISTERABLE_STATUSES.includes(registrationStatus) ? 'Previous Owner' : 'Owner',
      value: nameDetails?.owner ? <User address={nameDetails?.owner as `0x${string}`} /> : null,
      canCopy: false,
    },
    // {
    //   label: 'Created',
    //   value: nameDetails?.registration_date ? formatExpiryDate(nameDetails.registration_date) : null,
    //   canCopy: false,
    // },
    {
      label: 'Category',
      value: (
        <div className='flex flex-row flex-wrap justify-end gap-2!'>
          {nameDetails?.clubs && nameDetails?.clubs.length > 0
            ? nameDetails?.clubs?.map((club) => (
                <Link
                  key={club}
                  href={`/categories/${club}`}
                  className='text-primary flex min-w-fit gap-1 font-medium transition-colors hover:opacity-80'
                >
                  <Image
                    src={CATEGORY_IMAGES[club as keyof typeof CATEGORY_IMAGES].avatar}
                    alt={club}
                    width={24}
                    height={24}
                    className='aspect-square! rounded-full'
                  />
                  <p className='text-nowrap'>{CATEGORY_LABELS[club as keyof typeof CATEGORY_LABELS]}</p>
                </Link>
              ))
            : 'None'}
        </div>
      ),
      canCopy: false,
    },
    {
      label: 'Status',
      value:
        registrationStatus === GRACE_PERIOD ? (
          <Tooltip
            label={`Ends ${formatExpiryDate(new Date(new Date(nameDetails?.expiry_date || '').getTime() + 90 * DAY_IN_SECONDS * 1000).toISOString(), { includeTime: true, dateDivider: '/' })}`}
            align='right'
            position='top'
          >
            <p className='text-grace text-xl font-medium'>Grace {timeLeftString ? `(${timeLeftString})` : ''}</p>
          </Tooltip>
        ) : (
          <p
            className={`cursor-pointer text-xl font-semibold hover:opacity-80 ${registrationStatus === PREMIUM ? 'text-premium' : registrationStatus === UNREGISTERED ? 'text-available' : 'text-foreground/70 cursor-text hover:opacity-100'}`}
            onClick={() => {
              if (registrationStatus === PREMIUM || registrationStatus === UNREGISTERED) {
                router.push(`/marketplace?tab=${registrationStatus.toLowerCase()}&sort=expiry_date_asc`)
              }
            }}
          >
            {registrationStatus}
            {timeLeftString && registrationStatus === PREMIUM && <> ({timeLeftString})</>}
          </p>
        ),
      canCopy: false,
    },
    {
      label: 'Last Sale',
      value:
        nameDetails?.last_sale_price && nameDetails?.last_sale_currency ? (
          <Price
            price={convertWeiPrice(nameDetails?.last_sale_price, nameDetails?.last_sale_currency, ethPrice)}
            currencyAddress={nameDetails?.last_sale_currency as Address}
            iconSize='24px'
            fontSize='text-xl font-semibold'
            alignTooltip='right'
          />
        ) : (
          ''
        ),
      canCopy: false,
    },
    {
      label: registrationStatus === UNREGISTERED ? 'Expired' : 'Expires',
      value: nameDetails?.expiry_date ? formatExpiryDate(nameDetails.expiry_date) : null,
      canCopy: false,
    },
    {
      label: 'Token ID',
      value: nameDetails?.token_id ? truncateAddress(nameDetails?.token_id as `0x${string}`) : null,
      canCopy: true,
    },
    {
      label: 'Namehash',
      value: nameDetails?.token_id ? truncateAddress(numberToHex(BigInt(nameDetails.token_id))) : null,
      canCopy: true,
    },
  ]

  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const { openConnectModal } = useConnectModal()

  const openExtendNameModal = () => {
    if (!userAddress) {
      openConnectModal?.()
      return
    }
    if (!nameDetails) return
    dispatch(setBulkRenewalModalDomains([nameDetails]))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const openTransferModal = () => {
    if (!userAddress || authStatus !== 'authenticated') {
      openConnectModal?.()
      return
    }

    if (!nameDetails) return

    dispatch(
      setTransferModalDomains([
        {
          name: nameDetails.name,
          tokenId: nameDetails.token_id,
          owner: nameDetails.owner,
          expiry_date: nameDetails.expiry_date,
        },
      ])
    )
    dispatch(setTransferModalOpen(true))
  }

  const isOwner = userAddress?.toLowerCase() === nameDetails?.owner?.toLowerCase()

  return (
    <div className='flex flex-col'>
      <div className='bg-tertiary h-fit w-full'>
        {nameDetails?.token_id && (
          <NameImage
            name={nameDetails.name}
            tokenId={nameDetails.token_id}
            expiryDate={nameDetails.expiry_date}
            className='bg-tertiary mx-auto aspect-square w-full max-w-lg'
          />
        )}
        {nameDetailsIsLoading && <LoadingCell height='100%' width='100%' className='aspect-square' />}
      </div>
      <div className='p-lg lg:p-xl flex flex-col items-center gap-3 lg:pt-5'>
        {/* Keyword Metrics - Search Volume & Quality */}
        <KeywordMetrics name={name} />

        <div className='flex w-full flex-row gap-2'>
          {REGISTERED_STATUSES.includes(registrationStatus) && (isOwner || !isSubname) && (
            <>
              {userAddress?.toLowerCase() === nameDetails?.owner?.toLowerCase() && (
                <SecondaryButton
                  onClick={openTransferModal}
                  className='w-full text-lg'
                  disabled={authStatus !== 'authenticated'}
                >
                  Transfer
                </SecondaryButton>
              )}
              {!isSubname && (
                <PrimaryButton onClick={openExtendNameModal} className='w-full text-lg'>
                  Extend
                </PrimaryButton>
              )}
            </>
          )}
          <div className='flex w-fit justify-center gap-2'>
            <button
              className='bg-tertiary flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm hover:opacity-80'
              onClick={() => {
                window.open(`https://app.ens.domains/${name}`, '_blank')
              }}
            >
              <Image src={ENS_LOGO} alt='ENS Logo' width={28} height={28} className='h-6.5 w-6.5' />
            </button>
            <button
              className='bg-tertiary flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm hover:opacity-80'
              onClick={() => {
                window.open(
                  `https://opensea.io/item/ethereum/${isWrapped ? ENS_NAME_WRAPPER_ADDRESS.toLowerCase() : ENS_REGISTRAR_ADDRESS.toLowerCase()}/${nameDetails?.token_id}`,
                  '_blank'
                )
              }}
            >
              <Image src={OPENSEA_LOGO} alt='Opensea Logo' width={28} height={28} className='h-6.5 w-6.5' />
            </button>
            <button
              className='bg-tertiary flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm hover:opacity-80'
              onClick={() => {
                window.open(`https://ensvision.com/name/${name}`, '_blank')
              }}
            >
              <Image src={ENSVISION_LOGO} alt='ENS Vision Logo' width={28} height={28} className='h-6.5 w-6.5' />
            </button>
          </div>
        </div>
        {rows.map((row) => {
          // Subnames don't have a status
          if (isSubname && row.label === 'Status') return null
          const isUserRow = row.label === 'Owner' || row.label === 'Previous Owner'

          return (
            <div key={row.label} className='flex w-full flex-row items-start justify-between gap-2'>
              <p className='font-sedan-sc text-2xl'>{row.label}</p>
              {typeof row.value === 'string' ? (
                <CopyValue value={row.value} canCopy={row.canCopy} />
              ) : (
                <div className={cn(isUserRow ? 'flex max-w-3/4 flex-col items-end justify-center gap-2' : 'max-w-3/4')}>
                  <div className={cn(isUserRow ? 'flex flex-row items-center gap-2.5 overflow-visible' : 'max-w-full')}>
                    {row.value}
                    {isUserRow && nameDetails?.owner && (
                      <Image
                        src={isOwnerCopied ? CheckIcon : CopyIcon}
                        alt='Copy'
                        className='h-4 w-4 cursor-pointer hover:opacity-80'
                        width={16}
                        height={16}
                        onClick={async () => {
                          const account = await fetchAccount(nameDetails?.owner as `0x${string}`)
                          console.log(account)

                          if (account) {
                            navigator.clipboard.writeText(account.ens?.name as string)
                            setIsOwnerCopied(true)
                            setTimeout(() => {
                              setIsOwnerCopied(false)
                            }, 2000)

                            return
                          }

                          navigator.clipboard.writeText(nameDetails?.owner as string)
                          setIsOwnerCopied(true)
                          setTimeout(() => {
                            setIsOwnerCopied(false)
                          }, 2000)
                        }}
                      />
                    )}
                  </div>
                  {isUserRow && nameDetails?.owner && (
                    <div className='text-neutral flex max-w-full flex-row items-center gap-1 truncate'>
                      <p className='max-w-full truncate'>{truncateAddress(nameDetails?.owner)}</p>
                      <Image
                        src={isOwnerAddressCopied ? CheckIcon : CopyIcon}
                        alt='Copy'
                        className='h-4 w-4 cursor-pointer hover:opacity-80'
                        width={16}
                        height={16}
                        onClick={() => {
                          navigator.clipboard.writeText(nameDetails?.owner as string)
                          setIsOwnerAddressCopied(true)
                          setTimeout(() => {
                            setIsOwnerAddressCopied(false)
                          }, 2000)
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CopyValue = ({ value, canCopy }: { value: string; canCopy: boolean }) => {
  const [isCopied, setIsCopied] = useState(false)
  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => {
      setIsCopied(false)
    }, 2000)
  }

  return (
    <div
      className='flex max-w-1/2 cursor-pointer flex-row items-center gap-1'
      onClick={() => {
        if (canCopy) handleCopy(value)
      }}
    >
      <p className='max-w-full truncate text-xl'>{value}</p>
      {canCopy && <Image src={isCopied ? CheckIcon : CopyIcon} alt='Copy' className='h-4 w-4' />}
    </div>
  )
}

export default NameDetails
