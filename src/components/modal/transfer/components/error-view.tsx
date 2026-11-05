import TxStatus from '@/components/ui/modal/txStatus'
import TxLink from '@/components/ui/modal/txLink'
import Notice from '@/components/ui/modal/notice'
import type { TransferTransaction } from '@/types/transfer'
import { getTransferTransactionUrl } from '@/utils/transfer'

interface TransferErrorViewProps {
  /** A transaction went out but its receipt never came; the only safe action is checking it. */
  unconfirmed: boolean
  error: string | null
  errorDetails: string | null
  /** The submitted transaction, linked on the unconfirmed screen. */
  pendingTransaction: TransferTransaction | null
  /** Names already moved in an earlier batch, with their transactions. */
  partial: { transferred: number; total: number; transactions: TransferTransaction[] } | null
}

const TransferErrorView: React.FC<TransferErrorViewProps> = ({
  unconfirmed,
  error,
  errorDetails,
  pendingTransaction,
  partial,
}) => {
  if (unconfirmed) {
    return (
      <TxStatus state='error' title='Confirmation Unavailable' message={error ?? undefined}>
        {pendingTransaction && (
          <TxLink
            label='View pending transaction'
            hash={pendingTransaction.hash}
            href={getTransferTransactionUrl(pendingTransaction)}
          />
        )}
      </TxStatus>
    )
  }

  return (
    <>
      <TxStatus state='error' title='Transfer Failed' message='Review the details below and try again.' />
      {partial && partial.transferred > 0 && (
        <Notice tone='warning' title={`${partial.transferred} of ${partial.total} names transferred.`}>
          Retrying will only transfer the remaining names.
          {partial.transactions.length > 0 && (
            <span className='mt-2 flex flex-wrap gap-1.5'>
              {partial.transactions.map((transaction, index) => (
                <TxLink
                  key={`${transaction.version}-${transaction.hash}`}
                  label={`Transaction ${index + 1}`}
                  hash={transaction.hash}
                  href={getTransferTransactionUrl(transaction)}
                />
              ))}
            </span>
          )}
        </Notice>
      )}
      <Notice tone='danger' details={errorDetails}>
        {error || 'Transfer failed. Please try again.'}
      </Notice>
    </>
  )
}

export default TransferErrorView
