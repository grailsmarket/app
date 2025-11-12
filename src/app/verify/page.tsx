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
      className='px-lg flex min-h-screen w-full flex-col items-center justify-center gap-4 pt-20 md:pt-24'
      style={{ minHeight: 'calc(100vh - 360px)' }}
    >
      <Verify />
    </main>
  )
}

export default UserPage
