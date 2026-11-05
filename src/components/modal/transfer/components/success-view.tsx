import TxStatus from '@/components/ui/modal/txStatus'
import TxLink from '@/components/ui/modal/txLink'
import type { TransferTransaction } from '@/types/transfer'
import { getTransferTransactionUrl } from '@/utils/transfer'

interface TransferSuccessViewProps {
  /** "coffee.eth transferred to vitalik.eth." or "230 names transferred to vitalik.eth." */
  message: string
  transactions: TransferTransaction[]
}

// One link for a single transaction, "Transaction 1…n" for several.
const TransferSuccessView: React.FC<TransferSuccessViewProps> = ({ message, transactions }) => (
  <TxStatus state='success' title='Transfer Successful' message={message}>
    {transactions.length > 0 && (
      <div className='flex flex-wrap justify-center gap-1.5'>
        {transactions.map((transaction, index) => (
          <TxLink
            key={`${transaction.version}-${transaction.hash}`}
            hash={transaction.hash}
            href={getTransferTransactionUrl(transaction)}
            label={transactions.length > 1 ? `Transaction ${index + 1}` : 'View on Etherscan'}
          />
        ))}
      </div>
    )}
  </TxStatus>
)

export default TransferSuccessView
