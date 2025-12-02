import { Suspense } from 'react'
import Verify from './verify'

export const metadata = {
  title: `Verify Email`,
  description: `Verify your email address on Grails`,
}

const UserPage = () => {
  return (
    <main className='px-lg flex min-h-[calc(100dvh-56px)] w-full flex-col items-center justify-center gap-4 pt-16 md:min-h-[calc(100dvh-78px)] md:pt-24'>
      <Suspense fallback={<div>Loading...</div>}>
        <Verify />
      </Suspense>
    </main>
  )
}

export default UserPage
