import Notice from '@/components/ui/modal/notice'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { modalActionClassName, modalDangerActionClassName } from '@/components/ui/modal/modalShell'

interface CancelViewProps {
  isBulk: boolean
  namesProcessed: number
  totalNames: number
}

// The confirmation behind "Cancel" on the progress screen; the renewal keeps running behind it.
const CancelView: React.FC<CancelViewProps> = ({ isBulk, namesProcessed, totalNames }) => {
  return (
    <Notice tone='warning' title='Cancel Renewal?'>
      {isBulk
        ? `Are you sure you want to cancel this renewal? No further transactions will be requested. Names already extended stay extended, and a transaction you already sent will still confirm. ${namesProcessed} of ${totalNames} names are extended so far.`
        : 'Are you sure you want to cancel this renewal? No further transactions will be requested, and a transaction you already sent will still confirm.'}
    </Notice>
  )
}

export const CancelFooter: React.FC<{ onContinue: () => void; onCancel: () => void }> = ({ onContinue, onCancel }) => (
  <>
    <SecondaryButton onClick={onContinue} className={modalActionClassName}>
      Continue
    </SecondaryButton>
    <SecondaryButton onClick={onCancel} className={modalDangerActionClassName}>
      Cancel Renewal
    </SecondaryButton>
  </>
)

export const ProgressFooter: React.FC<{ onCancel: () => void }> = ({ onCancel }) => (
  <SecondaryButton onClick={onCancel} className={modalActionClassName}>
    Cancel
  </SecondaryButton>
)

export default CancelView
