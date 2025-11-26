'use client'

import PrimaryButton from '@/components/ui/buttons/primary'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { verifyEmail } from '@/api/user/verifyEmail'
import { useRouter } from 'next/navigation'
import SecondaryButton from '@/components/ui/buttons/secondary'

const Verify = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const {
    mutate: verifyEmailMutation,
    isPending: isVerifyingEmail,
    error: verifyEmailError,
    isSuccess,
  } = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error('No token provided')
      }

      const response = await verifyEmail(token)

      return response
    },
    onSuccess: () => {
      setTimeout(() => {
        router.push('/')
      }, 3000)
    },
  })

  return (
    <main className='flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center gap-4 md:min-h-[calc(100dvh-78px)]'>
      <h1 className='font-sedan-sc text-4xl'>Verify Email</h1>
      {isVerifyingEmail ? (
        <div className='flex w-full flex-col items-center justify-center gap-4 pt-4'>
          <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
          <p className='text-neutral'>Verifying your email address on Grails...</p>
        </div>
      ) : isSuccess ? (
        <p className='text-green-500'>Email verified successfully! Redirecting to home page...</p>
      ) : verifyEmailError ? (
        <p className='text-red-500'>Failed to verify email</p>
      ) : (
        <p className='text-neutral'>Please verify your email address on Grails</p>
      )}
      {isSuccess ? (
        <SecondaryButton onClick={() => router.push('/')} className='mt-2 w-64'>
          Back Home
        </SecondaryButton>
      ) : (
        <PrimaryButton onClick={() => verifyEmailMutation()} disabled={isVerifyingEmail} className='mt-2 w-64'>
          {isVerifyingEmail ? 'Verifying...' : 'Verify'}
        </PrimaryButton>
      )}
    </main>
  )
}

export default Verify
