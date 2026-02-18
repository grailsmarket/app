'use client'

import React, { ReactNode, useState } from 'react'
import { Address, isAddress, numberToHex } from 'viem'
import { MarketplaceDomainType } from '@/types/domains'
import Price from '@/components/ui/price'
import { cn } from '@/utils/tailwind'
import { convertWeiPrice } from '@/utils/convertWeiPrice'
import useETHPrice from '@/hooks/useETHPrice'
import { ShortArrow } from 'ethereum-identity-kit'
import { CopyValue } from './primaryDetails'
import LoadingSpinner from '@/components/ui/loadingSpinner'
import { RolesType } from '@/types/api'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'

type Row = {
  label: string
  value: string | number | ReactNode | null | undefined
  canCopy: boolean
}

interface NameDetailsProps {
  nameDetails?: MarketplaceDomainType | null
  nameDetailsIsLoading: boolean
  roles?: RolesType | null
}

const SecondaryDetails: React.FC<NameDetailsProps> = ({ nameDetails, nameDetailsIsLoading, roles }) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(true)
  const { ethPrice } = useETHPrice()

  const rows: Row[] = [
    // {
    //   label: 'Created',
    //   value: nameDetails?.registration_date ? formatExpiryDate(nameDetails.registration_date) : null,
    //   canCopy: false,
    // },
    {
      label: 'Last Sale',
      value:
        nameDetails?.last_sale_price && nameDetails?.last_sale_currency ? (
          <Price
            price={convertWeiPrice(nameDetails?.last_sale_price, nameDetails?.last_sale_currency, ethPrice)}
            currencyAddress={nameDetails?.last_sale_currency as Address}
            iconSize='20px'
            fontSize='text-xl font-semibold'
            alignTooltip='right'
          />
        ) : null,
      canCopy: false,
    },
    {
      label: 'Token ID',
      value: nameDetails?.token_id ? nameDetails?.token_id : null,
      canCopy: true,
    },
    {
      label: 'Namehash',
      value: nameDetails?.token_id ? numberToHex(BigInt(nameDetails.token_id)).toString() : null,
      canCopy: true,
    },
    {
      label: 'Creation Date',
      value: nameDetails?.creation_date ? formatExpiryDate(nameDetails.creation_date) : null,
      canCopy: false,
    },
  ]

  return (
    <div className='bg-secondary border-tertiary p-lg flex flex-col gap-4 sm:rounded-lg sm:border-2'>
      <div
        className='flex cursor-pointer flex-row items-center justify-between transition-opacity hover:opacity-80'
        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
      >
        <h3 className='font-sedan-sc text-3xl'>Details</h3>
        <ShortArrow
          className={cn('h-4 w-4 flex-shrink-0 transition-transform', isDetailsOpen ? 'rotate-0' : 'rotate-180')}
        />
      </div>
      {isDetailsOpen &&
        (nameDetailsIsLoading ? (
          <div className='flex w-full items-center justify-center py-2'>
            <LoadingSpinner size='h-10 w-10' />
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-4'>
            {rows
              .filter((row) => row.value !== null)
              .map((row) => {
                return (
                  <div key={row.label} className='bg-secondary border-neutral pl-md flex w-full flex-col border-l-2'>
                    {row.canCopy && typeof row.value === 'string' ? (
                      <CopyValue value={row.value} canCopy={row.canCopy} truncateValue={true} />
                    ) : (
                      <div className='text-xl font-medium'>{row.value}</div>
                    )}
                    <p className='text-neutral text-lg font-medium'>{row.label}</p>
                  </div>
                )
              })}
            {roles && (
              <div key='roles' className='bg-secondary border-neutral pl-md flex w-full flex-col border-l-2'>
                <CopyValue
                  value={roles.resolver || '-'}
                  canCopy={isAddress(roles.resolver)}
                  truncateValue={isAddress(roles.resolver)}
                />
                <p className='text-neutral text-lg font-medium'>Resolver</p>
              </div>
            )}
            {}
          </div>
        ))}
    </div>
  )
}

export default SecondaryDetails
