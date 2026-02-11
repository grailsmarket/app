import { useAccount } from 'wagmi'
import { isAddress, type Address } from 'viem'
import { useQuery } from '@tanstack/react-query'
import { Avatar, fetchAccount, LoadingCell } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import Input from '@/components/ui/input'

interface SettingsInputProps {
  option: string
  Icon: string
  value: string
  resolvedAddress?: string
  disableValue: string
  placeholder?: string
  isEditingSettings: boolean
  setValue: (value: string) => void
  isLoading?: boolean
  isSettingsLoading?: boolean
}

const SettingsInput: React.FC<SettingsInputProps> = ({
  option,
  resolvedAddress,
  value,
  disableValue,
  placeholder,
  setValue,
  isEditingSettings,
  isLoading,
  isSettingsLoading,
}) => {
  const { address: connectedAddress } = useAccount()

  const { data: resolvedProfile, isLoading: isNameLoading } = useQuery({
    queryKey: ['ens metadata', isAddress(value) ? value : resolvedAddress],
    queryFn: async () => {
      const account = await fetchAccount((isAddress(value) ? value : resolvedAddress) as Address)
      return (
        account?.ens || {
          name: null,
          avatar: null,
        }
      )
    },
  })

  return (
    <div className='flex flex-col gap-1'>
      {isSettingsLoading ? (
        <div className='bg-neutral/70 w-full truncate rounded-sm p-3 font-medium disabled:cursor-not-allowed disabled:text-zinc-400'>
          <LoadingCell height='24px' width='100%' radius='4px' />
        </div>
      ) : (
        <Input
          label={option}
          value={value}
          placeholder={placeholder || 'Search placeholder'}
          onChange={(e) => {
            const input = e.target.value
            if (input.includes(' ')) return
            setValue(input)
          }}
          disabled={!isEditingSettings || connectedAddress?.toLowerCase() !== disableValue?.toLowerCase()}
        />
      )}
      {(isSettingsLoading || value.includes('.') || resolvedProfile?.name) && (
        <div
          className={cn(
            'flex h-10 items-center gap-2 pl-3 text-sm font-medium',
            (value.includes('.') && resolvedAddress && resolvedAddress?.length > 0) || resolvedProfile?.name
              ? 'text-text/80'
              : 'text-red-400'
          )}
        >
          {isSettingsLoading || isLoading || isNameLoading ? (
            <>
              <LoadingCell height='24px' width='24px' radius='4px' />
              <LoadingCell height='20px' width='100%' radius='4px' />
            </>
          ) : (
            <>
              <Avatar
                name={resolvedProfile?.name || value}
                style={{ height: '26px', width: '26px' }}
                src={resolvedProfile?.avatar}
              />
              <p className='truncate text-lg font-semibold'>
                {value.includes('.')
                  ? resolvedAddress && resolvedAddress?.length > 0
                    ? resolvedAddress
                    : 'No resolution'
                  : resolvedProfile?.name}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SettingsInput
