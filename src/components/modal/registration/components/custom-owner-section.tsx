import { isAddress } from 'viem'
import { AccountResponseType, Avatar, LoadingCell } from 'ethereum-identity-kit'
import ExpandableSection from './expandable-section'

interface CustomOwnerSectionProps {
  showCustomOwner: boolean
  setShowCustomOwner: (show: boolean) => void
  customOwner: string
  setCustomOwner: (value: string) => void
  debouncedCustomOwner: string
  account: AccountResponseType | null | undefined
  isResolving: boolean
}

const CustomOwnerSection: React.FC<CustomOwnerSectionProps> = ({
  showCustomOwner,
  setShowCustomOwner,
  customOwner,
  setCustomOwner,
  debouncedCustomOwner,
  account,
  isResolving,
}) => {
  return (
    <ExpandableSection
      title='Mint to address'
      preview={customOwner || 'Connected wallet'}
      isOpen={showCustomOwner}
      onToggle={() => setShowCustomOwner(!showCustomOwner)}
    >
      <p className='text-neutral text-sm'>Set a custom owner for the registration</p>
      <input
        aria-label='Mint to address'
        type='text'
        className='bg-background border-tertiary hover:bg-secondary focus:bg-secondary flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-lg transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
        placeholder='ENS Name or Address'
        value={customOwner || ''}
        onChange={(e) => setCustomOwner(e.target.value)}
      />
      {isResolving ? (
        <div className='flex items-center gap-2'>
          <LoadingCell height='24px' width='24px' radius='50%' />
          <LoadingCell height='14px' width='160px' radius='4px' />
        </div>
      ) : account?.address ? (
        <div key={account.address} className='flex items-center gap-2'>
          <Avatar
            address={account.address}
            src={account.ens?.avatar}
            name={account.ens?.name}
            style={{ width: '24px', height: '24px' }}
          />
          <p className='text-md text-neutral max-w-full truncate pt-0.5 font-medium'>
            {isAddress(debouncedCustomOwner) ? account.ens?.name : account.address}
          </p>
        </div>
      ) : null}
    </ExpandableSection>
  )
}

export default CustomOwnerSection
