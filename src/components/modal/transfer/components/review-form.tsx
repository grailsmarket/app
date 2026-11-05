import Input from '@/components/ui/input'
import { beautifyName } from '@/lib/ens'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'
import { getTransferDomainKey } from '@/utils/transfer'
import { Avatar, Check, type AccountResponseType } from 'ethereum-identity-kit'
import { isAddress } from 'viem'

interface TransferReviewFormProps {
  domains: TransferDomainType[]
  completedNames: Set<string>
  recipientInput: string
  setRecipientInput: (value: string) => void
  /** The account the recipient input resolves to. */
  account: AccountResponseType | null | undefined
  isResolving: boolean
  recipientError: string | null
  recipientLocked: boolean
  walletMismatch: boolean
}

// The names, the recipient field and its notes; the Transfer and Cancel buttons sit in the modal footer.
const TransferReviewForm: React.FC<TransferReviewFormProps> = ({
  domains,
  completedNames,
  recipientInput,
  setRecipientInput,
  account,
  isResolving,
  recipientError,
  recipientLocked,
  walletMismatch,
}) => {
  const hasV2 = domains.some((domain) => domain.version === 2)

  return (
    <>
      <div className='space-y-2'>
        <h3 className='px-lg text-lg font-semibold'>
          {domains.length > 1 ? `Names to Transfer (${domains.length})` : 'Name to Transfer'}
        </h3>
        <div className='bg-secondary max-h-48 overflow-y-auto rounded-md p-4'>
          {domains.map((domain) => (
            <div
              key={getTransferDomainKey(domain)}
              className='relative flex w-full items-center justify-between gap-2 py-1 font-bold'
            >
              <span className='truncate'>{beautifyName(domain.name)}</span>
              <span className='text-neutral text-xs'>V{domain.version}</span>
              {completedNames.has(getTransferDomainKey(domain)) && (
                <Check className='h-4 w-4 shrink-0 text-green-400' />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className='space-y-2'>
        <Input
          label='Recipient'
          value={recipientInput}
          onChange={(e) => setRecipientInput(e.target.value)}
          placeholder='Address or ENS name'
          disabled={recipientLocked}
        />
        {account?.address && !isResolving && (
          <div className='flex items-center gap-2'>
            {account.ens?.avatar && (
              <Avatar
                address={account.address}
                src={account.ens.avatar}
                name={account.ens.name}
                style={{ width: '24px', height: '24px' }}
              />
            )}
            <p className='text-md text-neutral max-w-full truncate pt-0.5 font-medium'>
              {isAddress(recipientInput.trim()) ? account.ens?.name || account.address : account.address}
            </p>
          </div>
        )}
        {isResolving && <p className='text-neutral text-sm'>Resolving recipient...</p>}
        {recipientError && <p className='text-sm text-red-400'>{recipientError}</p>}
        {walletMismatch && <p className='text-sm text-red-400'>Reconnect the wallet that started this transfer.</p>}
        {recipientLocked && (
          <p className='text-neutral text-sm'>The recipient is fixed while completing the remaining transfers.</p>
        )}
      </div>
      {hasV2 && (
        <p className='text-neutral text-sm'>
          Resolver configurations and their permissions stay unchanged when a name transfers.
        </p>
      )}
    </>
  )
}

export default TransferReviewForm
