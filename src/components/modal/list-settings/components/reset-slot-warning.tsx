import SecondaryButton from '@/components/ui/buttons/secondary'

interface ResetSlotWarningProps {
  closeModal: () => void
  onSubmit: () => void
}

const ResetSlotWarning: React.FC<ResetSlotWarningProps> = ({ closeModal, onSubmit }) => {
  return (
    <div className='fixed inset-0 z-50 flex min-h-[100dvh] w-screen items-end justify-center bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-start md:overflow-y-auto md:p-4 md:py-[5vh] starting:translate-y-[100vh] md:starting:translate-y-0'>
      <div className='border-tertiary bg-background p-lg sm:p-xl relative flex max-h-[calc(100dvh-70px)] w-full flex-col gap-4 overflow-y-auto border-t md:max-h-none md:max-w-md md:rounded-md md:border-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold'>Reset slot</h2>
        </div>
        <p className='px-4 text-lg font-medium'>Are you sure you want to reset the List? This will clear your list and set all the roles back to your wallet address. This action cannot be undone.</p>
        <div className='pt- flex justify-between gap-2'>
          <SecondaryButton onClick={closeModal} className='w-1/2'>Cancel</SecondaryButton>
          <button
            onClick={() => {
              onSubmit()
              closeModal()
            }}
            className='w-1/2 rounded-sm bg-red-500 px-6 py-2 text-lg font-bold text-nowrap text-white transition-all hover:scale-105 hover:opacity-75'
          >
            Reset slot
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetSlotWarning
