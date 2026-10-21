'use client'

import { useSettings } from '@/components/modal/settings/useSettings'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { cn } from '@/utils/tailwind'
import { useSettingsDirty } from './navigationGuard'
import PrimaryNameSettings from './primaryNameSettings'
import { QueryError, SettingsNotice } from './shared'

interface ProfileSettingsProps {
  notifications?: boolean
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ notifications = false }) => {
  const settings = useSettings()
  const validThreshold =
    !settings.offerNotificationThresholdValue ||
    (Number.isFinite(Number(settings.offerNotificationThresholdValue)) &&
      Number(settings.offerNotificationThresholdValue) >= 0)

  useSettingsDirty(
    settings.hasChanges || settings.emailAddress !== settings.email.address,
    settings.updateUserProfileMutationLoading
  )

  const toggles = [
    {
      label: 'Listing sold',
      description: 'When one of your names sells.',
      value: settings.notifyOnListingSoldValue,
      set: settings.setNotifyOnListingSoldValue,
    },
    {
      label: 'Offer received',
      description: 'When someone makes an offer on your name.',
      value: settings.notifyOnOfferReceivedValue,
      set: settings.setNotifyOnOfferReceivedValue,
    },
    {
      label: 'Comment received',
      description: 'When someone comments on your name.',
      value: settings.notifyOnCommentReceivedValue,
      set: settings.setNotifyOnCommentReceivedValue,
    },
  ]

  return (
    <div className='flex max-w-2xl flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <h2 className='hidden text-2xl font-semibold md:block'>
          {notifications ? 'Notifications' : 'Profile details'}
        </h2>
        <p className='text-neutral text-kg'>
          {notifications
            ? 'Choose which updates you receive from Grails.'
            : 'Manage the details associated with your signed-in wallet.'}
        </p>
      </div>
      {!notifications ? (
        <>
          <PrimaryNameSettings />
          <SettingsNotice>
            Your email is used for Grails notifications. Your labels and preferences belong to this wallet.
          </SettingsNotice>
          <Input
            label='Email'
            type='email'
            value={settings.emailAddress ?? ''}
            onChange={(event) => settings.setEmailAddress(event.target.value)}
            placeholder='you@example.com'
            disabled={settings.updateUserProfileMutationLoading}
          />
          {!settings.isEmailValid && (
            <p className='text-lg text-red-400' role='alert'>
              Enter a valid email address.
            </p>
          )}
          {settings.email.address &&
            settings.emailAddress === settings.email.address &&
            (settings.isEmailVerified ? (
              <p className='text-lg text-green-400'>Email verified.</p>
            ) : (
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <p className='text-grace text-lg'>Verify your email to receive notifications.</p>
                <SecondaryButton
                  onClick={settings.sendVerificationEmail}
                  disabled={settings.verificationEmailStatus === 'pending'}
                >
                  {settings.verificationEmailStatus === 'pending'
                    ? 'Sending…'
                    : settings.verificationEmailStatus === 'success'
                      ? 'Email sent'
                      : 'Resend email'}
                </SecondaryButton>
              </div>
            ))}
          {settings.verificationEmailStatus === 'error' && (
            <SettingsNotice error>Could not send the verification email. Please try again.</SettingsNotice>
          )}
        </>
      ) : (
        <>
          <div className='border-tertiary divide-tertiary divide-y rounded-md border'>
            {toggles.map((toggle) => (
              <div key={toggle.label} className='flex items-center justify-between gap-4 p-4'>
                <div>
                  <p className='text-lg font-semibold'>{toggle.label}</p>
                  <p className='text-neutral text-lg'>{toggle.description}</p>
                </div>
                <button
                  type='button'
                  role='switch'
                  aria-checked={toggle.value}
                  aria-label={toggle.label}
                  disabled={settings.updateUserProfileMutationLoading}
                  onClick={() => toggle.set(!toggle.value)}
                  className={cn(
                    'relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50',
                    toggle.value ? 'bg-primary' : 'bg-tertiary'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                      toggle.value && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
          <div className='flex flex-col gap-2'>
            <Input
              label='Minimum offer'
              inputMode='decimal'
              labelClassName='min-w-36 md:min-w-40'
              value={settings.offerNotificationThresholdValue ?? ''}
              onChange={(event) => {
                if (/^\d*\.?\d*$/.test(event.target.value))
                  settings.setOfferNotificationThresholdValue(event.target.value || null)
              }}
              placeholder='0.00'
              suffix='ETH'
            />
            <p className='text-neutral text-lg'>Only notify you about offers at or above this amount.</p>
          </div>
        </>
      )}
      {settings.updateUserProfileMutationError && <QueryError error={settings.updateUserProfileMutationError} />}
      {settings.hasChanges && (
        <div className='border-tertiary'>
          <PrimaryButton
            className='w-full'
            disabled={
              !settings.hasChanges ||
              settings.updateUserProfileMutationLoading ||
              !settings.isEmailValid ||
              !validThreshold
            }
            onClick={() => settings.updateUserProfileMutation()}
          >
            {settings.updateUserProfileMutationLoading ? 'Saving…' : 'Save changes'}
          </PrimaryButton>
        </div>
      )}
    </div>
  )
}

export default ProfileSettings
