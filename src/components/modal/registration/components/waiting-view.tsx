import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import NameChips from '@/components/ui/modal/nameChips'
import { beautifyName } from '@/lib/ens'
import type { NameRegistrationEntry } from '@/types/registration'

interface WaitingViewProps {
  waitTimeRemaining: number
  isBulk: boolean
  firstName: string | null
  availableEntries: NameRegistrationEntry[]
  steps: TxStep[]
}

const WaitingView: React.FC<WaitingViewProps> = ({ waitTimeRemaining, isBulk, firstName, availableEntries, steps }) => {
  return (
    <>
      {waitTimeRemaining > 0 ? (
        <TxStatus
          state='waiting'
          seconds={waitTimeRemaining}
          total={60}
          title='Waiting Period'
          message='This prevents others from front-running your registration.'
        />
      ) : (
        <TxStatus
          state='ready'
          title='Ready to Register'
          message={
            isBulk
              ? `${availableEntries.length} names are ready for registration.`
              : `${beautifyName(firstName!)} is ready for registration.`
          }
        />
      )}
      {isBulk && <NameChips names={availableEntries.map((e) => beautifyName(e.name))} />}
      <TxSteps steps={steps} />
    </>
  )
}

export default WaitingView
