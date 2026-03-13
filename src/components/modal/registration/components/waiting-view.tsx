import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { beautifyName } from '@/lib/ens'
import type { NameRegistrationEntry } from '@/types/registration'
import CollapsibleNameList from './collapsible-name-list'

interface WaitingViewProps {
  waitTimeRemaining: number
  isBulk: boolean
  firstName: string | null
  availableEntries: NameRegistrationEntry[]
  batches: { batchIndex: number; commitTxHash: string | null }[]
  totalBatches: number
  onRegister: () => void
  onCancel: () => void
}

const WaitingView: React.FC<WaitingViewProps> = ({
  waitTimeRemaining,
  isBulk,
  firstName,
  availableEntries,
  batches,
  totalBatches,
  onRegister,
  onCancel,
}) => {
  return (
    <div className='flex w-full flex-col gap-4'>
      <h2 className='text-center text-xl font-bold'>Waiting Period</h2>
      {waitTimeRemaining > 0 ? (
        <>
          <div className='flex flex-col items-center justify-center gap-4'>
            <div className='relative h-32 w-32'>
              <svg className='h-32 w-32 -rotate-90 transform'>
                <circle
                  cx='64'
                  cy='64'
                  r='60'
                  stroke='currentColor'
                  strokeWidth='8'
                  fill='none'
                  className='text-tertiary'
                />
                <circle
                  cx='64'
                  cy='64'
                  r='60'
                  stroke='currentColor'
                  strokeWidth='8'
                  fill='none'
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (waitTimeRemaining / 60)}`}
                  className='text-primary transition-all duration-1000 ease-linear'
                />
              </svg>
              <div className='absolute inset-0 flex items-center justify-center'>
                <span className='text-4xl font-bold tabular-nums'>{waitTimeRemaining}s</span>
              </div>
            </div>
            <p className='text-center text-lg'>This prevents others from front-running your registration.</p>
            {isBulk && <CollapsibleNameList names={availableEntries.map((e) => beautifyName(e.name))} />}
            {batches
              .filter((b) => b.commitTxHash)
              .map((b, i) => (
                <a
                  key={b.batchIndex}
                  href={`https://etherscan.io/tx/${b.commitTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-md underline transition-colors'
                >
                  {totalBatches > 1 ? `Commitment ${i + 1}` : 'Commitment Transaction'}
                </a>
              ))}
          </div>
        </>
      ) : (
        <div className='flex flex-col items-center justify-center gap-4 pb-4'>
          <p className='flex items-center gap-1.5 font-medium'>
            {isBulk ? (
              <>
                <CollapsibleNameList names={availableEntries.map((e) => beautifyName(e.name))} />
                <span>are ready for registration.</span>
              </>
            ) : (
              <>
                <span className='font-bold'>{beautifyName(firstName!)}</span> is ready for registration.
              </>
            )}
          </p>
        </div>
      )}
      <div className='flex flex-col gap-2'>
        <PrimaryButton onClick={onRegister} disabled={waitTimeRemaining > 0} className='w-full'>
          {waitTimeRemaining > 0 ? `Wait ${waitTimeRemaining} seconds...` : 'Complete Registration'}
        </PrimaryButton>
        <SecondaryButton onClick={onCancel} className='w-full'>
          Cancel
        </SecondaryButton>
      </div>
    </div>
  )
}

export default WaitingView
