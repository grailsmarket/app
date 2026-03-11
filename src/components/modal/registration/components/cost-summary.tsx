import type { CalculationResults, NameRegistrationEntry } from '@/types/registration'

interface CostSummaryProps {
  calculationResults: CalculationResults | null
  isBulk: boolean
  availableEntries: NameRegistrationEntry[]
  totalBatches: number
  hasSufficientBalance: boolean
  allNamesValid: boolean
  gasEstimate: bigint | null
  gasPrice: bigint | undefined
}

const CostSummary: React.FC<CostSummaryProps> = ({
  calculationResults,
  isBulk,
  availableEntries,
  totalBatches,
  hasSufficientBalance,
  allNamesValid,
  gasEstimate,
  gasPrice,
}) => {
  return (
    <div className='flex flex-col gap-2'>
      {calculationResults && (
        <div className='bg-secondary border-tertiary rounded-lg border p-3'>
          <div className='text-md space-y-2'>
            {!isBulk && (
              <div className='flex items-center justify-between'>
                <p>Registration Duration:</p>
                <p className='font-medium'>{calculationResults.durationYears.toFixed(2)} years</p>
              </div>
            )}
            <div className='flex items-center justify-between'>
              <p>Total Cost (ETH):</p>
              <div className='flex flex-col items-end'>
                <p className='font-medium'>{calculationResults.priceETH.toFixed(6)} ETH</p>
                <p className='text-neutral text-xs'>(${calculationResults.priceUSD.toFixed(2)})</p>
              </div>
            </div>
            {gasEstimate && gasPrice && (
              <div className='flex justify-between'>
                <span>Estimated Gas:</span>
                <span className='font-medium'>
                  ~{(Number((gasEstimate * gasPrice) / BigInt(10 ** 12)) / 10 ** 6).toFixed(6)} ETH
                </span>
              </div>
            )}
            {isBulk && (
              <div className='flex items-center justify-between'>
                <p>Names:</p>
                <p className='font-medium'>{availableEntries.length}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {calculationResults?.isBelowMinimum && (
        <div className='rounded-lg border border-amber-500/20 bg-amber-900/20 p-3'>
          <p className='text-md text-amber-400'>
            Minimum registration duration is 28 days. Please select a longer duration.
          </p>
        </div>
      )}
      <div className='bg-secondary border-tertiary rounded-lg border p-3'>
        <p className='text-md text-neutral'>
          {totalBatches > 1
            ? `This registration requires ${totalBatches} commit + ${totalBatches} register transactions.`
            : 'Note: You will have to make 2 transactions to complete your registration.'}
        </p>
      </div>
      {calculationResults && !hasSufficientBalance && (
        <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
          <p className='text-md text-red-400'>
            Insufficient ETH balance. You need approximately {(calculationResults.priceETH + 0.01).toFixed(4)} ETH to
            complete this registration (including gas costs).
          </p>
        </div>
      )}
      {!allNamesValid && (
        <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
          <p className='text-md text-red-400'>
            {isBulk
              ? 'Some names contain invalid characters and cannot be registered.'
              : 'This name contains invalid characters and cannot be registered.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default CostSummary
