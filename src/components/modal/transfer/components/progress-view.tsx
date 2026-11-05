import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import NameChips from '@/components/ui/modal/nameChips'
import { beautifyName } from '@/lib/ens'
import type { TransferProgressStatus } from './transfer-steps'

interface TransferProgressViewProps {
  status: TransferProgressStatus
  /** The names of the batch being signed or confirmed, for several names. */
  batchNames: string[] | null
  steps: TxStep[]
}

// Busy screens: what is happening now, the batch's names, then every step of this run.
const TransferProgressView: React.FC<TransferProgressViewProps> = ({ status, batchNames, steps }) => (
  <>
    <TxStatus state={status.state} title={status.title} message={status.message} />
    {batchNames && batchNames.length > 0 && <NameChips names={batchNames.map(beautifyName)} max={4} />}
    <TxSteps steps={steps} />
  </>
)

export default TransferProgressView
