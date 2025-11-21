'use client'

import React from 'react'
import Image from 'next/image'
import { Avatar, ENS, HeaderImage } from 'ethereum-identity-kit'
import { useSettings } from './useSettings'
import Input from '@/components/ui/input'
import Link from 'next/link'
import PrimaryButton from '@/components/ui/buttons/primary'
import AlertCircle from 'public/icons/alert-circle.svg'
import ErrorIcon from 'public/icons/cancelled.svg'
import SecondaryButton from '@/components/ui/buttons/secondary'
import CheckCircle from 'public/icons/check-circle.svg'
import { cn } from '@/utils/tailwind'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    email,
    emailAddress,
    setEmailAddress,
    // discordUsername,
    // setDiscordUsername,
    // telegramUsername,
    // setTelegramUsername,
    ensProfile,
    haveChanges,
    isEmailVerified,
    isEmailValid,
    updateUserProfileMutation,
    updateUserProfileMutationLoading,
    updateUserProfileMutationError,
    sendVerificationEmail,
    verificationEmailStatus,
  } = useSettings()

  return (
    <div
      className={cn(
        'fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:px-2 md:py-12 starting:translate-y-[100vh] md:starting:translate-y-0',
        isOpen ? 'translate-y-0' : 'translate-y-[100vh]'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      <div
        className='bg-background border-tertiary p-lg md:p-xl relative flex max-h-[calc(100dvh-62px)] w-full flex-col gap-2 rounded-md border-t shadow-lg sm:gap-4 md:max-w-xl md:border-2'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex min-h-6 items-center justify-center'>
          <h2 className='font-sedan-sc text-foreground text-3xl'>Settings</h2>
          {/* <button onClick={onClose} className='hover:bg-primary/10 rounded-md p-1 transition-colors'>
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button> */}
        </div>
        <div>
          <div className='p-md md:p-lg border-tertiary relative flex items-center justify-between gap-1 overflow-hidden rounded-md border md:gap-2'>
            {ensProfile.header && <HeaderImage src={ensProfile.header} isLoading={false} style={{ opacity: 0.2 }} />}
            <div className='relative z-10 flex max-w-[calc(100%-80px)] items-center gap-1 truncate md:gap-2'>
              <Avatar
                src={ensProfile.avatar}
                name={ensProfile.name}
                className='h-9 w-9 min-w-9 overflow-hidden rounded-full sm:h-10 sm:w-10 md:h-12 md:w-12'
              />
              <p className='xs:text-xl line-clamp-2 truncate text-lg font-semibold sm:text-xl md:text-2xl'>
                {ensProfile.name}
              </p>
            </div>
            <Link
              href={`https://app.ens.domains/name/${ensProfile.name}`}
              target='_blank'
              className='sm:px-md relative z-10 flex h-9 min-w-[92px] items-center justify-center gap-1 rounded-md bg-[#0080bc] transition-opacity hover:opacity-80 sm:h-10 sm:gap-1.5'
            >
              <ENS className='h-4 w-4 sm:h-5 sm:w-5' />
              <p className='text-md font-semibold sm:text-lg'>Edit Profile</p>
            </Link>
          </div>
        </div>
        <div className='flex flex-col gap-2 sm:gap-4'>
          {/* <Input
            label='Discord'
            value={discordUsername || ''}
            onChange={(e) => setDiscordUsername(e.target.value)}
            placeholder='Username'
            />
            <Input
            label='Telegram'
            value={telegramUsername || ''}
            onChange={(e) => setTelegramUsername(e.target.value)}
            placeholder='@telegramusername'
            /> */}
          <div className='flex flex-col gap-2'>
            <div className='bg-secondary px-lg py-md flex flex-col gap-2 rounded-md'>
              <p className='text-md text-neutral font-medium'>
                Your email is going to be used to send you notifications and updates from Grails.
              </p>
            </div>
            <Input
              label='Email'
              value={emailAddress || ''}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder='myemail@example.com'
            />
            {email &&
              (isEmailVerified ? (
                <div className='p-md flex items-center gap-2 rounded-md bg-green-400/10'>
                  <Image src={CheckCircle} alt='Email Verified' height={20} width={20} />
                  <p className='text-md max-w-full font-medium text-[#16A34A]'>Your email address is verified.</p>
                </div>
              ) : (
                <div className='flex flex-row gap-2'>
                  <div className='p-md flex items-center gap-2 rounded-md bg-yellow-400/10'>
                    <Image src={AlertCircle} alt='Email Verified' height={32} width={32} />
                    <p className='text-md max-w-full font-medium text-[#E79339]'>
                      Your email address is not verified. You have received an email to verify your email.
                    </p>
                  </div>
                  <SecondaryButton
                    className={cn(
                      'h-auto! w-40 px-0!',
                      verificationEmailStatus === 'error'
                        ? 'pointer-events-none bg-red-500'
                        : verificationEmailStatus === 'success'
                          ? 'pointer-events-none bg-green-700'
                          : ''
                    )}
                    onClick={sendVerificationEmail}
                    disabled={verificationEmailStatus === 'pending'}
                  >
                    {verificationEmailStatus === 'pending'
                      ? 'Sending...'
                      : verificationEmailStatus === 'success'
                        ? 'Email Sent!'
                        : verificationEmailStatus === 'error'
                          ? 'Error, try again.'
                          : 'Resend Email'}
                  </SecondaryButton>
                </div>
              ))}
          </div>
        </div>
        {updateUserProfileMutationError && (
          <div className='bg-secondary p-md flex items-center gap-2 rounded-md'>
            <Image src={ErrorIcon} alt='Error' height={24} width={24} />
            <p style={{ maxWidth: 'calc(100% - 48px)' }} className='text-md font-medium text-red-400'>
              {updateUserProfileMutationError.message}
            </p>
          </div>
        )}
        <div className='flex flex-col gap-2'>
          <PrimaryButton
            className='w-full'
            onClick={() => updateUserProfileMutation()}
            disabled={!haveChanges || !isEmailValid || updateUserProfileMutationLoading}
          >
            {updateUserProfileMutationLoading ? 'Saving...' : 'Save Changes'}
          </PrimaryButton>
          <SecondaryButton className='w-full' onClick={onClose}>
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
