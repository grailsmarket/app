import TxStatus from '@/components/ui/modal/txStatus'
import TxLink from '@/components/ui/modal/txLink'
import Notice from '@/components/ui/modal/notice'
import ExpiryList, { type ExpiryListItem } from './expiry-list'
import type { RenewalLink } from './success-view'

interface ErrorViewProps {
  error: string
  errorDetails?: string | null
  /** A batch was sent but its receipt never came: the unconfirmed screen. */
  pendingTransaction: RenewalLink | null
  namesProcessed: number
  totalNames: number
  remainingCount: number
  /** Duration and currency are fixed for the retry. */
  parametersLocked: boolean
  completedLinks: RenewalLink[]
  /** Several names: every name with those already extended ticked. */
  expiryItems: ExpiryListItem[] | null
}

const ErrorView: React.FC<ErrorViewProps> = ({
  error,
  errorDetails,
  pendingTransaction,
  namesProcessed,
  totalNames,
  remainingCount,
  parametersLocked,
  completedLinks,
  expiryItems,
}) => {
  const partialNotice = namesProcessed > 0 && (
    <Notice tone='warning' title={`${namesProcessed} of ${totalNames} names were successfully extended.`}>
      {[
        remainingCount > 0 ? `${remainingCount} names remaining.` : null,
        parametersLocked ? 'Duration and currency are fixed while retrying this renewal.' : null,
      ]
        .filter(Boolean)
        .join(' ')}
      {completedLinks.length > 0 && (
        <span className='mt-2 flex flex-wrap gap-1.5'>
          {completedLinks.map((link, index) => (
            <TxLink key={link.key} hash={link.hash} href={link.href} label={`Transaction ${index + 1}`} />
          ))}
        </span>
      )}
    </Notice>
  )

  return (
    <>
      {pendingTransaction ? (
        <TxStatus state='error' title='Confirmation Unavailable' message={error}>
          <TxLink label='View pending transaction' hash={pendingTransaction.hash} href={pendingTransaction.href} />
        </TxStatus>
      ) : (
        <TxStatus state='error' title='Extension Failed' message='Review the details below and try again.' />
      )}
      {partialNotice}
      {!pendingTransaction && (
        <Notice tone='danger' details={errorDetails}>
          {error}
        </Notice>
      )}
      {expiryItems && <ExpiryList items={expiryItems} />}
    </>
  )
}

export default ErrorView
