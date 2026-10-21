import LoadingCell from '@/components/ui/loadingCell'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import { useQuery } from '@tanstack/react-query'
import { Avatar, fetchAccount } from 'ethereum-identity-kit'
import { Address, isAddress } from 'viem'
import { accountQueryKey } from '@/utils/queryKeys'

const InputWithResolution: React.FC<{
  value: string
  resolvedAddress: string | null
  isResolving: boolean
  showNameImage?: boolean
}> = ({ value, resolvedAddress, isResolving, showNameImage = false }) => {
  const accountLookupTarget = isAddress(value) ? value : resolvedAddress

  const { data: resolvedAccount, isLoading: isProfileLoading } = useQuery({
    queryKey: accountQueryKey(accountLookupTarget),
    queryFn: async () => {
      return await fetchAccount(accountLookupTarget as Address)
    },
    enabled: !!accountLookupTarget && isAddress(accountLookupTarget),
  })

  const resolvedProfile = resolvedAccount?.ens || { name: null, avatar: null }

  const showResolution = value?.includes('.') || (isAddress(value) && resolvedProfile?.name)

  if (!showResolution && !isResolving) return null

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-2 pl-3 text-sm font-medium',
        (value.includes('.') && resolvedAddress && resolvedAddress.length > 0) || resolvedProfile?.name
          ? 'opacity-80'
          : 'text-red-400'
      )}
    >
      {isResolving || isProfileLoading ? (
        <>
          <LoadingCell height='24px' width='24px' radius='4px' />
          <LoadingCell height='20px' width='100%' radius='4px' />
        </>
      ) : (
        <>
          {showNameImage && !value.includes('.') && resolvedProfile.name ? (
            <NameImage
              name={resolvedProfile.name}
              tokenId=''
              version={1}
              expiryDate={null}
              forceRegStatus='Registered'
              width={26}
              height={26}
              className='shrink-0'
            />
          ) : (
            <Avatar
              name={resolvedProfile?.name || value}
              style={{ height: '26px', width: '26px' }}
              src={resolvedProfile?.avatar}
            />
          )}
          <p className='truncate text-lg font-semibold'>
            {value.includes('.')
              ? resolvedAddress && resolvedAddress.length > 0
                ? resolvedAddress
                : 'No resolution'
              : resolvedProfile?.name
                ? beautifyName(resolvedProfile?.name)
                : 'No resolution'}
          </p>
        </>
      )}
    </div>
  )
}

export default InputWithResolution
