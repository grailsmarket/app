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
  EXPIRED_STATUSES,
  PREMIUM,
  GRACE_PERIOD,
  UNREGISTERED,
  REGISTERED,
  REGISTERED_STATUSES,
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
import { formatTimeLeft } from '@/utils/time/formatTimeLeft'

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
  const { ethPrice } = useETHPrice()

  const rows: Row[] = [
    {
      label: 'Name',
      value: nameDetails?.name ? beautifyName(nameDetails.name) : name,
      canCopy: true,
    },
    {
      label: EXPIRED_STATUSES.includes(registrationStatus) ? 'Previous Owner' : 'Owner',
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
      value: (
        <p
          className={`text-xl font-semibold ${registrationStatus === GRACE_PERIOD ? 'text-grace' : registrationStatus === PREMIUM ? 'text-premium' : registrationStatus === REGISTERED ? 'text-available' : 'text-foreground/70'}`}
        >
          {registrationStatus}{' '}
          {nameDetails?.expiry_date &&
            (registrationStatus === GRACE_PERIOD
              ? `(${formatTimeLeft(nameDetails?.expiry_date, 'grace')})`
              : registrationStatus === PREMIUM
                ? `(${formatTimeLeft(nameDetails?.expiry_date, 'premium')})`
                : '')}
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
      value: nameDetails?.token_id,
      canCopy: true,
    },
    {
      label: 'Namehash',
      value: nameDetails?.token_id ? numberToHex(BigInt(nameDetails.token_id)) : null,
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
        {REGISTERED_STATUSES.includes(registrationStatus) && (isOwner || !isSubname) && (
          <div className='flex w-full flex-row gap-2'>
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
          </div>
        )}
        {rows.map((row) => {
          // Subnames don't have a status
          if (isSubname && row.label === 'Status') return null
          const isUserRow = row.label === 'Owner' || row.label === 'Previous Owner'

          return (
            <div key={row.label} className='flex w-full flex-row items-center justify-between gap-2'>
              <p className='font-sedan-sc text-2xl'>{row.label}</p>
              {typeof row.value === 'string' ? (
                <CopyValue value={row.value} canCopy={row.canCopy} />
              ) : (
                <div
                  className={cn(
                    row.label === 'Owner' || row.label === 'Previous Owner'
                      ? 'flex flex-row items-center gap-2.5 overflow-visible'
                      : 'max-w-3/4 overflow-x-auto'
                  )}
                >
                  {row.value}
                  {isUserRow && nameDetails?.owner && (
                    <Image
                      src={isOwnerCopied ? CheckIcon : CopyIcon}
                      alt='Copy'
                      className='h-4 w-4 cursor-pointer hover:opacity-80'
                      width={16}
                      height={16}
                      onClick={() => {
                        navigator.clipboard.writeText(nameDetails?.owner as string)
                        setIsOwnerCopied(true)
                        setTimeout(() => {
                          setIsOwnerCopied(false)
                        }, 2000)
                      }}
                    />
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
