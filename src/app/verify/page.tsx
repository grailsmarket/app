import { Suspense } from 'react'
import Verify from './verify'

export const metadata = {
  title: `Categories | Grails`,
  description: `Browse all categories on Grails`,
  openGraph: {
    title: `Categories | Grails`,
    siteName: `Categories | Grails`,
    description: `Browse all categories on Grails`,
    url: `https://grails.app/categories`,
    images: [{ url: `https://grails.app/categories/og` }],
  },
}

const UserPage = () => {
  return (
    <main
      className='px-lg flex w-full flex-col items-center justify-center gap-4 pt-16 md:pt-24 min-h-[calc(100dvh-62px)] md:min-h-[calc(100dvh-78px)]'
    >
      <Suspense fallback={<div>Loading...</div>}>
        <Verify />
      </Suspense>
    </main>
  )
}

export default UserPage
