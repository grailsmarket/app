import { cn } from '@/utils/tailwind'

interface ReverseRecordSectionProps {
  reverseRecord: boolean
  setReverseRecord: (reverseRecord: boolean) => void
}

const ReverseRecordSection: React.FC<ReverseRecordSectionProps> = ({ reverseRecord, setReverseRecord }) => {
  return (
    <div className='border-tertiary flex flex-col gap-2 rounded-md border p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex flex-col'>
          <p className='text-lg font-medium'>Set as Primary Name</p>
          <p className='text-neutral text-sm'>Set this name as the primary ENS name for your address</p>
        </div>
        <button
          type='button'
          onClick={() => setReverseRecord(!reverseRecord)}
          className={cn(
            'group relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
            reverseRecord ? 'bg-primary' : 'bg-tertiary'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-200',
              reverseRecord ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </button>
      </div>
    </div>
  )
}

export default ReverseRecordSection
