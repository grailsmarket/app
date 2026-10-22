import StatusOrb from '@/components/ui/modal/statusOrb'
import TxStatus from '@/components/ui/modal/txStatus'
import TxLink from '@/components/ui/modal/txLink'
import Notice from '@/components/ui/modal/notice'

interface ResolverSetupViewProps {
  isDeploying: boolean
  txHash: string | null
}

const ResolverSetupView: React.FC<ResolverSetupViewProps> = ({ isDeploying, txHash }) => {
  if (isDeploying) {
    return (
      <TxStatus
        state={txHash ? 'pending' : 'wallet'}
        title='Deploying Resolver'
        message={
          txHash
            ? 'Your registration will continue once the resolver is ready.'
            : 'Confirm the deployment in your wallet.'
        }
      >
        {txHash && <TxLink hash={txHash} label='View transaction' />}
      </TxStatus>
    )
  }

  return (
    <>
      <div className='flex flex-col items-center gap-2 pt-5 pb-1 text-center'>
        <StatusOrb state='ready' className='mb-3' />
        <h3 className='text-2xl font-bold'>Set Up a Resolver</h3>
        <p className='text-neutral max-w-80 text-lg'>
          A resolver lets you manage your names’ addresses and records. Deploy one now, or add one later.
        </p>
      </div>
      <Notice tone='info'>Deploying requires an additional transaction and gas fee.</Notice>
    </>
  )
}

export default ResolverSetupView
