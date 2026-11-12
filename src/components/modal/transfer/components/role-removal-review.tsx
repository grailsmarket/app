import SecondaryButton from '@/components/ui/buttons/secondary'
import { beautifyName } from '@/lib/ens'
import { getTransferError } from '@/utils/transfer'
import type { useTransferModal } from '../hooks/use-transfer-modal'

interface TransferRoleRemovalReviewProps {
  roleRemoval: ReturnType<typeof useTransferModal>['roleRemoval']
  canIgnoreRoleNames: boolean
  onIgnoreRoleNames: () => void
}

const TransferRoleRemovalReview: React.FC<TransferRoleRemovalReviewProps> = ({
  roleRemoval,
  canIgnoreRoleNames,
  onIgnoreRoleNames,
}) => {
  const { query, removals, acknowledged, setAcknowledged, hasV2Names } = roleRemoval
  if (!hasV2Names || (query.isSuccess && !query.isFetching && removals.length === 0)) return null

  return (
    <div className='border-tertiary bg-secondary flex flex-col gap-3 rounded-md border p-3'>
      {query.isFetching || query.isPending ? (
        <p role='status' className='text-neutral text-md'>
          Checking for blocking roles…
        </p>
      ) : query.isError ? (
        <>
          <p role='alert' className='text-md'>
            {getTransferError(query.error)}
          </p>
          <SecondaryButton onClick={() => void query.refetch()}>Check again</SecondaryButton>
        </>
      ) : (
        <>
          <p id='transfer-blocking-roles-description' className='text-neutral text-md wrap-break-word'>
            Other addresses have roles that block transfers of{' '}
            {Array.from(new Set(removals.map((removal) => beautifyName(removal.name)))).join(', ')}. These roles must be
            removed before transferring. Each removal requires an onchain transaction and stays in effect if the
            transfer is cancelled or fails.
            {canIgnoreRoleNames && (
              <>
                {' '}
                <button
                  type='button'
                  className='text-primary cursor-pointer underline underline-offset-2'
                  onClick={onIgnoreRoleNames}
                >
                  Ignore those names and continue
                </button>
                .
              </>
            )}
          </p>
          <label className='text-md flex cursor-pointer items-center gap-2'>
            <input
              type='checkbox'
              aria-describedby='transfer-blocking-roles-description'
              className='accent-primary h-4 w-4 shrink-0 cursor-pointer'
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>Remove blocking roles and transfer</span>
          </label>
        </>
      )}
    </div>
  )
}

export default TransferRoleRemovalReview
