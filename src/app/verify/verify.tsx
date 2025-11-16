'use client'

import PrimaryButton from '@/components/ui/buttons/primary'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import router from 'next/router'
import { verifyEmail } from '@/api/user/verifyEmail'

const Verify = () => {
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
    <main className='flex min-h-[calc(100dvh-62px)] flex-col items-center justify-center gap-4 md:min-h-[calc(100dvh-78px)]'>
      <h1 className='font-sedan-sc text-4xl'>Verify Email</h1>
      {isVerifyingEmail ? (
        <p className='text-neutral'>Verifying your email address on Grails</p>
      ) : (
        <p className='text-neutral'>Verifying your email address on Grails</p>
      )}
      {verifyEmailError && <p className='text-red-500'>Failed to verify email</p>}
      {!isSuccess && (
        <PrimaryButton onClick={() => verifyEmailMutation()} disabled={isVerifyingEmail} className='mt-2 w-64'>
          {isVerifyingEmail ? 'Verifying...' : 'Verify'}
        </PrimaryButton>
      )}
    </main>
  )
}

export default Verify
