'use client'

import React from 'react'
import Image from 'next/image'
import { Avatar, Cross, ENS, HeaderImage } from 'ethereum-identity-kit'
import { useSettings } from './useSettings'
import Input from '@/components/ui/input'
import Link from 'next/link'
import PrimaryButton from '@/components/ui/buttons/primary'
import AlertCircle from 'public/icons/alert-circle.svg'
import ErrorIcon from 'public/icons/cancelled.svg'
import SecondaryButton from '@/components/ui/buttons/secondary'
import CheckCircle from 'public/icons/check-circle.svg'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
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
  } = useSettings()

  if (!isOpen) return null

  return (
    <div
      className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center bg-black/50 px-2 py-12 backdrop-blur-sm'
      onClick={onClose}
    >
      <div
        className='bg-background border-primary p-xl relative flex w-full max-w-xl flex-col gap-4 rounded-md border-2 shadow-lg'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='font-sedan-sc text-foreground text-3xl'>Settings</h2>
          <button onClick={onClose} className='hover:bg-primary/10 rounded-md p-1 transition-colors'>
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button>
        </div>
        <div>
          <div className='p-lg border-primary relative flex items-center justify-between gap-2 overflow-hidden rounded-md border'>
            {ensProfile.header && <HeaderImage src={ensProfile.header} isLoading={false} style={{ opacity: 0.2 }} />}
            <div className='relative z-10 flex items-center gap-2'>
              <Avatar src={ensProfile.avatar} name={ensProfile.name} style={{ width: '48px', height: '48px' }} />
              <p className='text-2xl font-semibold'>{ensProfile.name}</p>
            </div>
            <Link
              href={`https://app.ens.domains/name/${ensProfile.name}`}
              target='_blank'
              className='px-md relative z-10 flex h-10 items-center justify-center gap-1.5 rounded-md bg-[#0080bc] transition-opacity hover:opacity-80'
            >
              <ENS height={20} width={20} />
              <p className='text-lg font-semibold'>Edit Profile</p>
            </Link>
          </div>
        </div>
        <div className='flex flex-col gap-4'>
          <div className='bg-secondary px-lg py-md flex flex-col gap-2 rounded-md'>
            <p className='text-md text-neutral font-medium'>
              Your email is going to be used to send you notifications and updates from Grails.
            </p>
          </div>
          <Input
            label='Email'
            value={emailAddress || ''}
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder='mymail@example.com'
          />
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
        </div>
        {isEmailVerified ? (
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
            <SecondaryButton className='w-40 px-0!' onClick={() => sendVerificationEmail()}>
              Resend Email
            </SecondaryButton>
          </div>
        )}
        {updateUserProfileMutationError && (
          <div className='bg-secondary p-md flex items-center gap-2 rounded-md'>
            <Image src={ErrorIcon} alt='Error' height={24} width={24} />
            <p style={{ maxWidth: 'calc(100% - 48px)' }} className='text-md font-medium text-red-400'>
              {updateUserProfileMutationError.message}
            </p>
          </div>
        )}
        <PrimaryButton
          className='w-full'
          onClick={() => updateUserProfileMutation()}
          disabled={!haveChanges || !isEmailValid || updateUserProfileMutationLoading}
        >
          {updateUserProfileMutationLoading ? 'Saving...' : 'Save Changes'}
        </PrimaryButton>
      </div>
    </div>
  )
}

export default SettingsModal
