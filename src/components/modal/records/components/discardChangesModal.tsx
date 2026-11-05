'use client'

import { useEffect, useRef } from 'react'
import SecondaryButton from '@/components/ui/buttons/secondary'

interface DiscardChangesModalProps {
  onCancel: () => void
  onDiscard: () => void
  changingResolver?: boolean
  pendingTransaction?: boolean
  description?: string
}

const DiscardChangesModal = ({
  onCancel,
  onDiscard,
  changingResolver = false,
  pendingTransaction = false,
  description,
}: DiscardChangesModalProps) => {
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopImmediatePropagation()
        onCancel()
      }
      if (event.key === 'Tab') {
        const buttons = dialog.current?.querySelectorAll('button')
        if (!buttons?.length) return
        if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === dialog.current)) {
          event.preventDefault()
          buttons[buttons.length - 1].focus()
        } else if (!event.shiftKey && document.activeElement === buttons[buttons.length - 1]) {
          event.preventDefault()
          buttons[0].focus()
        }
      }
    }
    document.addEventListener('keydown', keydown, true)
    return () => {
      document.removeEventListener('keydown', keydown, true)
      previous?.focus()
    }
  }, [onCancel])
  return (
    <div
      className='fixed inset-0 z-1100 flex h-dvh items-end justify-center bg-black/40 backdrop-blur-sm md:items-center md:p-4'
      onClick={(event) => {
        event.stopPropagation()
        onCancel()
      }}
    >
      <div
        ref={dialog}
        role='alertdialog'
        aria-modal='true'
        aria-labelledby='discard-changes-title'
        aria-describedby='discard-changes-description'
        tabIndex={-1}
        className='bg-background border-tertiary p-lg sm:p-xl flex w-full flex-col gap-4 rounded-md border-t outline-none md:max-w-md md:border-2'
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id='discard-changes-title' className='font-sedan-sc text-center text-3xl'>
          Discard changes?
        </h2>
        <p id='discard-changes-description' className='text-neutral text-center text-lg'>
          {description ??
            (changingResolver
              ? 'Changing the resolver will discard your unsaved record and permission changes.'
              : 'Closing this window will discard all unsaved changes.')}
        </p>
        {pendingTransaction && (
          <p className='text-neutral text-center text-lg'>Closing does not cancel transactions already submitted.</p>
        )}
        <div className='flex flex-col gap-2 pt-2'>
          <SecondaryButton className='w-full' onClick={onCancel}>
            Continue editing
          </SecondaryButton>
          <SecondaryButton className='w-full bg-red-500! text-white' onClick={onDiscard}>
            {changingResolver ? 'Discard and change resolver' : 'Discard changes'}
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default DiscardChangesModal
