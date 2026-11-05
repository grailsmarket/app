import { AccountResponseType } from 'ethereum-identity-kit'
import Disclosure from '@/components/ui/modal/disclosure'
import TextInput from '@/components/ui/modal/textInput'
import AccountChip from '@/components/ui/modal/accountChip'

interface CustomOwnerSectionProps {
  showCustomOwner: boolean
  setShowCustomOwner: (show: boolean) => void
  customOwner: string
  setCustomOwner: (value: string) => void
  account: AccountResponseType | null | undefined
  isResolving: boolean
}

const CustomOwnerSection: React.FC<CustomOwnerSectionProps> = ({
  showCustomOwner,
  setShowCustomOwner,
  customOwner,
  setCustomOwner,
  account,
  isResolving,
}) => {
  return (
    <Disclosure
      title='Mint to address'
      preview={customOwner || 'Connected wallet'}
      isOpen={showCustomOwner}
      onToggle={() => setShowCustomOwner(!showCustomOwner)}
      description='Set a custom owner for the registration'
    >
      <TextInput
        aria-label='Mint to address'
        placeholder='ENS Name or Address'
        value={customOwner || ''}
        onChange={(e) => setCustomOwner(e.target.value)}
        autoComplete='off'
        spellCheck={false}
      />
      <AccountChip
        loading={isResolving}
        address={account?.address}
        name={account?.ens?.name}
        avatar={account?.ens?.avatar}
      />
    </Disclosure>
  )
}

export default CustomOwnerSection
