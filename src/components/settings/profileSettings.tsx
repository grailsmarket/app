'use client'

import PrimaryName from './primaryName'
import { useSettings } from '@/components/modal/settings/useSettings'
import { buttonClass, Field, inputClass, Notice } from '@/components/ens-v2/ui'

export default function ProfileSettings({ section }: { section: 'profile' | 'notifications' }) {
  const settings = useSettings(section)
  const toggles = [
    ['Listing sold', settings.notifyOnListingSoldValue, settings.setNotifyOnListingSoldValue],
    ['Offer received', settings.notifyOnOfferReceivedValue, settings.setNotifyOnOfferReceivedValue],
    ['Comment received', settings.notifyOnCommentReceivedValue, settings.setNotifyOnCommentReceivedValue],
  ] as const
  return (
    <div className='flex max-w-2xl flex-col gap-5'>
      <h2 className='text-2xl font-semibold'>{section === 'profile' ? 'Profile details' : 'Notifications'}</h2>
      {section === 'profile' ? (
        <>
          <Field label='Email address'>
            <input
              type='email'
              className={inputClass}
              value={settings.emailAddress ?? ''}
              onChange={(event) => settings.setEmailAddress(event.target.value || null)}
            />
          </Field>
          <p className='text-neutral text-sm'>
            Private contact details for Grails. This does not change your public ENS email record.
          </p>
          {settings.email.address && (
            <Notice>
              {settings.isEmailVerified ? 'Your email is verified.' : 'Verify your email to receive notifications.'}
            </Notice>
          )}
          {!settings.isEmailVerified && (
            <button
              className={`${buttonClass} self-start`}
              onClick={settings.sendVerificationEmail}
              disabled={settings.verificationEmailStatus === 'pending'}
            >
              {settings.verificationEmailStatus === 'success' ? 'Email sent' : 'Resend verification email'}
            </button>
          )}
          {settings.verificationEmailStatus === 'error' && (
            <Notice error>Could not send the verification email.</Notice>
          )}
        </>
      ) : (
        <>
          {toggles.map(([label, checked, setChecked]) => (
            <label key={label} className='border-tertiary flex items-center justify-between rounded-md border p-4'>
              <span>{label}</span>
              <input
                type='checkbox'
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
                className='accent-primary h-5 w-5'
              />
            </label>
          ))}
          <Field label='Minimum offer for notifications (ETH)'>
            <input
              className={inputClass}
              inputMode='decimal'
              value={settings.offerNotificationThresholdValue ?? ''}
              onChange={(event) => {
                if (/^\d*\.?\d*$/.test(event.target.value))
                  settings.setOfferNotificationThresholdValue(event.target.value || null)
              }}
            />
          </Field>
        </>
      )}
      <button
        className={`${buttonClass} self-start`}
        disabled={!settings.hasChanges || settings.updateUserProfileMutationLoading}
        onClick={() => settings.updateUserProfileMutation()}
      >
        {settings.updateUserProfileMutationLoading ? 'Saving…' : 'Save changes'}
      </button>
      {section === 'profile' && <PrimaryName />}
      {settings.updateUserProfileMutationError && (
        <Notice error>{settings.updateUserProfileMutationError.message}</Notice>
      )}
    </div>
  )
}
