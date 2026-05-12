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

  const text = email.address && !email.verified ? 'You have an email set, but not verified. Please verify your email to receive notifications and updates from Grails.' : 'Set your email to receive notifications and updates from Grails.'
  const buttonText = email.address && !email.verified ? 'Verify Email' : 'Set Email'

  return (
    <div className={cn('flex gap-2 p-md border-b border-tertiary bg-primary/20 rounded-sm items-center justify-between', className)}>
      <p className='text-md font-medium'>{text}</p>
      <PrimaryButton
        className='min-w-30'
        onClick={() => {
          onClick?.()
          setIsSettingsOpen(true)
        }}>
        {buttonText}
      </PrimaryButton>
    </div>
  )
}

export default SetEmailReminder