import React from 'react'
import NameImage from '@/components/ui/nameImage'
import NameVersionBadge from '@/components/ui/nameVersionBadge'
import { beautifyName } from '@/lib/ens'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import { normalizeName } from '@/lib/ens'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import Image from 'next/image'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { REGISTERED } from '@/constants/domains/registrationStatuses'

interface NameProps {
  name: string
  version: number
  tokenId: string
  clubs: string[]
}

const Name: React.FC<NameProps> = ({ name, version, tokenId, clubs }) => {
  const { categories } = useCategories()
  const category = clubs && clubs.length > 0 ? categories?.find((c) => c.name === clubs?.[0]) : null
  const categoryDetails = clubs && clubs.length > 0 ? getCategoryDetails(clubs?.[0]) : null

  return (
    <HoverPrefetchLink
      href={`/${normalizeName(name)}`}
      className='flex h-[36px] max-w-full flex-col justify-center hover:opacity-70'
    >
      <div className='flex w-full max-w-full flex-row items-center justify-start gap-2'>
        <NameImage
          name={name}
          version={version}
          tokenId={tokenId}
          expiryDate={null}
          forceRegStatus={REGISTERED}
          className='h-8 w-8 shrink-0 rounded-sm'
        />
        <div className='flex max-w-[calc(100%-40px)] min-w-0 flex-col'>
          <div className='flex min-w-0 items-center gap-1.5'>
            <p className='text-md truncate leading-[18px] font-bold'>{beautifyName(name)}</p>
            <NameVersionBadge version={version} />
          </div>
          {category && categoryDetails && (
            <div className='flex max-w-full flex-row items-center gap-1 truncate'>
              <div className='flex max-w-fit min-w-fit items-center gap-1'>
                <Image
                  src={categoryDetails.avatar}
                  alt={clubs[0] as string}
                  width={16}
                  height={16}
                  className='rounded-full'
                />
                <p className='text-md text-neutral truncate font-semibold'>{category?.display_name}</p>
              </div>
              {clubs.length > 1 && (
                <p className='text-md text-neutral truncate pt-0.5 font-bold'>+{clubs.length - 1}</p>
              )}
            </div>
          )}{' '}
        </div>
      </div>
    </HoverPrefetchLink>
  )
}

export default Name
