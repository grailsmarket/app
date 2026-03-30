import SecondaryButton from '@/components/ui/buttons/secondary'

interface ErrorViewProps {
  errorMessage: string | null
  onRetry: () => void
  onClose: () => void
}

const ErrorView: React.FC<ErrorViewProps> = ({ errorMessage, onRetry, onClose }) => {
  return (
    <div className='flex flex-col gap-4'>
      <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
        <p className='text-sm break-words text-red-400'>{errorMessage}</p>
      </div>
      <div className='flex flex-col gap-2'>
        <SecondaryButton onClick={onRetry} className='w-full'>
          Try Again
        </SecondaryButton>
        <SecondaryButton onClick={onClose} className='w-full'>
          Close
        </SecondaryButton>
      </div>
    </div>
  )
}

export default ErrorView
