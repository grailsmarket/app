import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import React from 'react'
import PrimaryButton from './buttons/primary'
import { cn } from '@/utils/tailwind'

interface SetEmailReminderProps {
  onClick?: () => void
  className?: string
}

const SetEmailReminder: React.FC<SetEmailReminderProps> = ({ onClick, className }) => {
  const { setIsSettingsOpen } = useUserContext()
  const { email } = useAppSelector(selectUserProfile)

  if (email.address && email.verified) return null

  const isOnlySet = email.address && !email.verified // Wether an email is set but not verified
  const text =
    isOnlySet
      ? 'Please verify your email to receive notifications and updates from Grails.'
      : 'Set your email to receive notifications and updates from Grails.'
  const buttonText = isOnlySet ? 'Verify' : 'Set Email'

  return (
    <div
      className={cn(
        'p-3 border-tertiary bg-primary/20 flex items-start justify-between gap-2 rounded-sm border-b',
        className
      )}
    >
      <p className='text-md font-medium'>{text}</p>
      <PrimaryButton
        className='min-w-20'
        onClick={() => {
          onClick?.()
          setIsSettingsOpen(true)
        }}
      >
        {buttonText}
      </PrimaryButton>
    </div>
  )
}

export default SetEmailReminder
