import Categories from './components/categories'

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
    <main className='md:p-lg p-md min-h-[calc(100dvh-52px)] w-full pt-12 md:min-h-[calc(100dvh-70px)] md:pt-18'>
      <Categories />
    </main>
  )
}

export default UserPage
