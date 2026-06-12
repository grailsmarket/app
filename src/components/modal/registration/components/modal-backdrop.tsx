import { cn } from '@/utils/tailwind'

interface ModalBackdropProps {
  children: React.ReactNode
  onClose?: () => void
  preventClose?: boolean
  className?: string
}

const ModalBackdrop: React.FC<ModalBackdropProps> = ({ children, onClose, preventClose, className }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (preventClose) return
        onClose?.()
      }}
      className='fixed inset-0 z-50 flex h-dvh w-screen items-end justify-end bg-black/40 backdrop-blur-sm md:items-center md:justify-center md:p-4'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t transition-all duration-300 sm:gap-4 md:max-w-md md:rounded-md md:border-2 starting:translate-y-full md:starting:translate-y-0',
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default ModalBackdrop
