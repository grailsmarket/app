'use client'

import Image from 'next/image'
import React, { useState } from 'react'
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
import { beautifyName } from '@/lib/ens'
import NameImage from '@/components/ui/nameImage'
import PrimaryButton from '@/components/ui/buttons/primary'
import { useAppDispatch } from '@/state/hooks'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import { setTransferModalDomains, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { cn } from '@/utils/tailwind'
import { useExpiryCountdown } from '@/hooks/useExpiryCountdown'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import ENS_LOGO from 'public/logos/ens-circle.svg'
import OPENSEA_LOGO from 'public/logos/opensea.svg'
import ENSVISION_LOGO from 'public/logos/ensvision.svg'
import ETHERSCAN_LOGO from 'public/logos/etherscan.svg'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'
import { ENS_NAME_WRAPPER_ADDRESS, ENS_REGISTRAR_ADDRESS } from '@/constants/web3/contracts'
import { useQuery } from '@tanstack/react-query'
import Tooltip from '@/components/ui/tooltip'
import { useRouter } from 'next/navigation'
import { DAY_IN_SECONDS } from '@/constants/time'

interface NameDetailsProps {
  name: string
  nameDetails?: MarketplaceDomainType | null
  nameDetailsIsLoading: boolean
  registrationStatus: RegistrationStatus
  isSubname: boolean
  openEditMetadataModal: () => void
}

const PrimaryDetails: React.FC<NameDetailsProps> = ({
  name,
  nameDetails,
  nameDetailsIsLoading,
  registrationStatus,
  isSubname,
  openEditMetadataModal,
}) => {
  const [isOwnerCopied, setIsOwnerCopied] = useState(false)

  // Determine countdown type based on registration status
  const countdownType =
    registrationStatus === PREMIUM ? 'premium' : registrationStatus === GRACE_PERIOD ? 'grace' : null
  const { timeLeftString } = useExpiryCountdown(nameDetails?.expiry_date ?? null, countdownType)
  const { data: isWrapped } = useQuery({
    queryKey: ['isWrapped', name],
    queryFn: () => checkIfWrapped(name),
  })

  const router = useRouter()
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
    <div className='bg-secondary border-tertiary flex flex-col sm:rounded-lg sm:border-2'>
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

      <div className='p-lg flex flex-col items-center gap-3 lg:pt-5'>
        {REGISTERED_STATUSES.includes(registrationStatus) && (isOwner || !isSubname) && (
          <div className='flex w-full flex-row items-center justify-between gap-2'>
            {!isSubname && (
              <PrimaryButton onClick={openExtendNameModal} className='w-full text-lg'>
                Extend
              </PrimaryButton>
            )}
            {userAddress?.toLowerCase() === nameDetails?.owner?.toLowerCase() && (
              <>
                <SecondaryButton
                  onClick={openTransferModal}
                  className='w-full text-lg'
                  disabled={authStatus !== 'authenticated'}
                >
                  Transfer
                </SecondaryButton>
                <SecondaryButton
                  onClick={openEditMetadataModal}
                  className='w-full text-lg'
                  disabled={authStatus !== 'authenticated'}
                >
                  Edit
                </SecondaryButton>
              </>
            )}
          </div>
        )}
        <div className='flex w-full flex-row items-start justify-between gap-2'>
          <CopyValue
            value={nameDetails?.name ? beautifyName(nameDetails.name) : name}
            canCopy={true}
            truncateValue={false}
            className='text-2xl font-bold md:text-3xl'
          />
        </div>
        <div className='border-neutral flex w-full flex-row items-center justify-between gap-2 border-l-2 pt-0.5 pl-2'>
          {nameDetailsIsLoading ? (
            <LoadingCell height='26px' width='128px' />
          ) : (
            <div className='flex flex-col items-start gap-0.5'>
              <div className='flex flex-row items-center gap-2'>
                {nameDetails?.owner && <User address={nameDetails.owner} alignTooltip='left' />}
                {nameDetails?.owner && (
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
              {nameDetails?.owner && (
                <div className='sm:hidde pt-1'>
                  <CopyValue value={nameDetails.owner} canCopy={true} truncateValue={true} className='text-neutral text-lg' /></div>
              )}
              <p className='text-neutral text-lg font-medium'>
                {REGISTERABLE_STATUSES.includes(registrationStatus) ? 'Previous Owner' : 'Owner'}
              </p>
            </div>
          )}
          {nameDetailsIsLoading ? (
            <LoadingCell height='20px' width='110px' />
          ) : (
            nameDetails?.owner && (
              <div className='hidden sm:block'>
                <CopyValue value={nameDetails.owner} canCopy={true} truncateValue={true} className='text-neutral' /></div>
            )
          )}
        </div>
        <div className='grid w-full grid-cols-2 gap-2 py-2'>
          <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
            {nameDetailsIsLoading ? (
              <LoadingCell height='44px' width='128px' />
            ) : (
              <>
                <p className='text-xl font-semibold'>
                  {formatExpiryDate(nameDetails?.expiry_date ?? '', { includeTime: false, dateDivider: '/' })}
                </p>
                <p className='text-neutral text-lg font-medium'>Expiration</p>
              </>
            )}
          </div>
          {!isSubname && (
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              {nameDetailsIsLoading ? (
                <LoadingCell height='44px' width='128px' />
              ) : (
                <>
                  {registrationStatus === GRACE_PERIOD ? (
                    <Tooltip
                      label={`Ends ${formatExpiryDate(new Date(new Date(nameDetails?.expiry_date || '').getTime() + 90 * DAY_IN_SECONDS * 1000).toISOString(), { includeTime: true, dateDivider: '/' })}`}
                      align='right'
                      position='top'
                    >
                      <p className='text-grace text-xl font-medium'>
                        Grace {timeLeftString ? `(${timeLeftString})` : ''}
                      </p>
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
                  )}
                  <p className='text-neutral text-lg font-medium'>Status</p>
                </>
              )}
            </div>
          )}
        </div>
        <div className='flex w-full flex-row gap-2'>
          <button
            className='bg-[#0080BC] flex h-9 w-1/4 cursor-pointer items-center justify-center rounded-sm hover:opacity-80 sm:h-10'
            onClick={() => {
              window.open(`https://app.ens.domains/${name}`, '_blank')
            }}
          >
            <Image src={ENS_LOGO} alt='ENS Logo' width={28} height={28} className='h-7.5 w-7.5 sm:h-8.5 sm:w-8.5' />
          </button>
          <button
            className='bg-[#0086FF] flex h-9 w-1/4 cursor-pointer items-center justify-center rounded-sm hover:opacity-80 sm:h-10'
            onClick={() => {
              window.open(
                `https://opensea.io/item/ethereum/${isWrapped ? ENS_NAME_WRAPPER_ADDRESS.toLowerCase() : ENS_REGISTRAR_ADDRESS.toLowerCase()}/${nameDetails?.token_id}`,
                '_blank'
              )
            }}
          >
            <Image src={OPENSEA_LOGO} alt='Opensea Logo' width={28} height={28} className='h-7.5 w-7.5 sm:h-8.5 sm:w-8.5' />
          </button>
          <button
            className='bg-[#895a01] flex h-9 w-1/4 cursor-pointer items-center justify-center rounded-sm hover:opacity-80 sm:h-10'
            onClick={() => {
              window.open(`https://ensvision.com/name/${name}`, '_blank')
            }}
          >
            <Image src={ENSVISION_LOGO} alt='ENS Vision Logo' width={28} height={28} className='h-6 w-6 sm:h-7 sm:w-7' />
          </button>
          <button
            className='bg-[#293e70] flex h-9 w-1/4 cursor-pointer items-center justify-center rounded-sm hover:opacity-80 sm:h-10'
            onClick={() => {
              window.open(
                `https://etherscan.io/token/${isWrapped ? ENS_NAME_WRAPPER_ADDRESS.toLowerCase() : ENS_REGISTRAR_ADDRESS.toLowerCase()}?a=${nameDetails?.token_id as `0x${string}`}`,
                '_blank'
              )
            }}
          >
            <Image src={ETHERSCAN_LOGO} alt='ENS Vision Logo' width={28} height={28} className='h-6.5 w-6.5' />
          </button>
        </div>
      </div>
    </div>
  )
}

export const CopyValue = ({
  value,
  canCopy,
  truncateValue,
  className,
}: {
  value: string
  canCopy: boolean
  truncateValue?: boolean
  className?: string
}) => {
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
      className='flex max-w-full cursor-pointer flex-row items-center gap-1.5'
      onClick={() => {
        if (canCopy) handleCopy(value)
      }}
    >
      <p className={cn('max-w-[calc(100%-16px)] truncate', className)}>
        {truncateValue && value ? truncateAddress(value as `0x${string}`) : value}
      </p>
      {canCopy && <Image src={isCopied ? CheckIcon : CopyIcon} alt='Copy' className='h-3.5 w-3.5' />}
    </div>
  )
}

export default PrimaryDetails
