import { type TransactionStatus } from '@/hooks/records/useBulkEditRecords'
import { Check } from 'ethereum-identity-kit'

const TransactionStatusRow: React.FC<{
  status: TransactionStatus
  index: number
  onRetry: (index: number) => void
}> = ({ status, index, onRetry }) => (
  <div className='border-tertiary flex items-center justify-between rounded-md border p-3'>
    <div className='flex flex-col gap-1'>
      <p className='text-md font-semibold'>
        Resolver {status.resolverAddress.slice(0, 6)}...{status.resolverAddress.slice(-4)}
      </p>
      <p className='text-neutral text-md'>
        {status.names.length} name{status.names.length !== 1 ? 's' : ''}
      </p>
    </div>
    <div className='flex items-center gap-2'>
      {status.status === 'pending' && <p className='text-neutral text-md'>Waiting</p>}
      {status.status === 'confirming' && (
        <div className='flex items-center gap-2'>
          <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
          <p className='text-md'>Confirm in wallet</p>
        </div>
      )}
      {status.status === 'processing' && (
        <div className='flex items-center gap-2'>
          <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
          <p className='text-md'>Processing</p>
        </div>
      )}
      {status.status === 'success' && (
        <div className='bg-primary rounded-full p-0.5'>
          <Check className='text-background h-3 w-3' />
        </div>
      )}
      {status.status === 'error' && (
        <button
          className='cursor-pointer rounded-md bg-red-900/30 px-2 py-1 text-sm text-red-400 hover:bg-red-900/50'
          onClick={() => onRetry(index)}
        >
          Retry
        </button>
      )}
      {status.txHash && (
        <a
          href={`https://etherscan.io/tx/${status.txHash}`}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary text-md hover:underline'
        >
          Tx
        </a>
      )}
    </div>
  </div>
)

export default TransactionStatusRow
