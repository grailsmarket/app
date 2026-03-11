import SecondaryButton from '@/components/ui/buttons/secondary'
import NameImage from '@/components/ui/nameImage'
import { YEAR_IN_SECONDS } from '@/constants/time'
import { BatchState, CalculationResults, NameRegistrationEntry } from '@/types/registration'
import Link from 'next/link'

interface SuccessViewProps {
  isBulk: boolean
  firstName: string | null
  firstDomain: NameRegistrationEntry['domain']
  availableEntries: NameRegistrationEntry[]
  batches: BatchState[]
  totalBatches: number
  calculationResults: CalculationResults | null
  onClose: () => void
}

const SuccessView: React.FC<SuccessViewProps> = ({
  isBulk,
  firstName,
  firstDomain,
  availableEntries,
  batches,
  totalBatches,
  calculationResults,
  onClose,
}) => {
  return (
    <div className='flex flex-col items-center gap-4'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <h3 className='text-2xl font-bold'>Registration Successful!</h3>
        {!isBulk && firstName ? (
          <Link href={`/${firstName}`} className='py-1 transition-opacity hover:opacity-70' onClick={onClose}>
            <NameImage
              name={firstName}
              tokenId={firstDomain?.token_id}
              expiryDate={new Date(
                Number(calculationResults?.durationSeconds ?? BigInt(YEAR_IN_SECONDS)) * 1000 + Date.now()
              ).toISOString()}
              className='h-48 w-48 rounded-lg'
              height={192}
              width={192}
            />
          </Link>
        ) : (
          <p className='text-lg font-medium'>{availableEntries.length} names registered</p>
        )}
        {batches
          .filter((b) => b.registerTxHash)
          .map((b, i) => (
            <a
              key={b.batchIndex}
              href={`https://etherscan.io/tx/${b.registerTxHash}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-primary hover:text-primary/80 text-lg underline transition-colors'
            >
              {totalBatches > 1 ? `Transaction ${i + 1} on Etherscan` : 'View Transaction on Etherscan'}
            </a>
          ))}
      </div>
      <SecondaryButton onClick={onClose} className='w-full'>
        Close
      </SecondaryButton>
    </div>
  )
}

export default SuccessView
