import { Address } from 'viem'
import DetailList, { type DetailRow } from '@/components/ui/modal/detailList'
import Notice from '@/components/ui/modal/notice'
import { TOKENS } from '@/constants/web3/tokens'
import type { CalculationResults, NameRegistrationEntry, SufficientBalanceResults } from '@/types/registration'

interface CostSummaryProps {
  calculationResults: CalculationResults | null
  isBulk: boolean
  availableEntries: NameRegistrationEntry[]
  totalBatches: number
  hasSufficientBalance: SufficientBalanceResults
  allNamesValid: boolean
  gasEstimate: bigint | null
  gasPrice: bigint | undefined
  asset: Address
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
  asset,
}) => {
  const durationDiscount = calculationResults?.durationDiscount
  const hasDurationDiscount = !!durationDiscount && durationDiscount.amount > 0

  const rows: DetailRow[] = []
  if (calculationResults) {
    rows.push(
      isBulk
        ? { key: 'names', label: 'Names', value: availableEntries.length }
        : { key: 'duration', label: 'Total Duration', value: `${calculationResults.durationYears.toFixed(2)} years` }
    )
  }
  if (hasDurationDiscount) {
    rows.push({
      key: 'discount',
      label: 'Duration discount',
      value: `-${durationDiscount.amount.toFixed(2)} ${TOKENS[asset]} (${Number(durationDiscount.percentage.toFixed(2))}%)`,
      tone: 'success',
    })
  }
  if (gasEstimate && gasPrice) {
    rows.push({
      key: 'gas',
      label: 'Estimated Gas',
      value: `~${(Number((gasEstimate * gasPrice) / BigInt(10 ** 12)) / 10 ** 6).toFixed(6)} ETH`,
    })
  }

  return (
    <>
      {calculationResults && (
        <DetailList
          rows={rows}
          total={{ label: 'Registration Cost', value: `${calculationResults.priceUSD.toFixed(2)} ${TOKENS[asset]}` }}
        />
      )}
      <Notice tone='info'>
        {totalBatches > 1
          ? `This registration requires ${totalBatches} commit + ${totalBatches} register transactions.`
          : 'Note: You will have to make 2 transactions to complete your registration.'}
      </Notice>
      {calculationResults?.isBelowMinimum && (
        <Notice tone='warning'>Minimum registration duration is 28 days. Please select a longer duration.</Notice>
      )}
      {calculationResults && !hasSufficientBalance.hasSufficientEth && (
        <Notice tone='danger'>Insufficient ETH balance to cover transaction gas.</Notice>
      )}
      {calculationResults && !hasSufficientBalance.hasSufficientAssets && (
        <Notice tone='danger'>
          Insufficient {TOKENS[asset]} balance. You need {calculationResults.priceUSD.toFixed(2)} {TOKENS[asset]} to pay
          for this registration.
        </Notice>
      )}
      {!allNamesValid && (
        <Notice tone='danger'>
          {isBulk
            ? 'Some names contain invalid characters and cannot be registered.'
            : 'This name contains invalid characters and cannot be registered.'}
        </Notice>
      )}
    </>
  )
}

export default CostSummary
