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
    <main className='px-lg w-full md:pt-20 pt-16 min-h-[calc(100dvh-62px)] md:min-h-[calc(100dvh-78px)]'>
      <Categories />
    </main>
  )
}

export default UserPage
