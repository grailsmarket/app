import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { activeChain } from '@/constants/web3/chain'

interface ResolverSetupViewProps {
  isDeploying: boolean
  txHash: string | null
  onDeploy: () => void
  onSkip: () => void
  onBack: () => void
}

const ResolverSetupView: React.FC<ResolverSetupViewProps> = ({ isDeploying, txHash, onDeploy, onSkip, onBack }) => (
  <div className='flex flex-col gap-4'>
    <h2 className='mt-4 text-center text-xl font-bold'>{isDeploying ? 'Deploying Resolver' : 'Set Up a Resolver'}</h2>
    <p className='text-neutral text-center'>
      {isDeploying
        ? 'Your registration will continue once the resolver is ready.'
        : 'A resolver lets you manage your names’ addresses and records. Deploy one now, or add one later.'}
    </p>
    {isDeploying ? (
      <div className='flex flex-col items-center gap-6 py-6'>
        <div className='border-primary h-12 w-12 animate-spin rounded-full border-b-2' />
        {txHash ? (
          <a
            href={`${activeChain.blockExplorers.default.url}/tx/${txHash}`}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary underline'
          >
            View transaction
          </a>
        ) : (
          <p className='text-neutral'>Confirm the deployment in your wallet.</p>
        )}
      </div>
    ) : (
      <>
        <p className='text-neutral text-center text-sm'>Deploying requires an additional transaction and gas fee.</p>
        <PrimaryButton onClick={onDeploy} className='w-full'>
          Deploy resolver
        </PrimaryButton>
        <SecondaryButton onClick={onSkip} className='w-full'>
          Skip for now
        </SecondaryButton>
        <button type='button' onClick={onBack} className='text-neutral cursor-pointer text-sm hover:underline'>
          Back
        </button>
      </>
    )}
  </div>
)

export default ResolverSetupView
