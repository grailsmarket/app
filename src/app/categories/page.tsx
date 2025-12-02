import Categories from './components/categories'

export const metadata = {
  title: `Categories`,
  description: `Browse all categories on Grails`,
  openGraph: {
    title: `Categories | Grails`,
    siteName: `Categories`,
    description: `Browse all ENS categories on Grails`,
    url: `https://grails.app/categories`,
    images: [{ url: `https://grails.app/banners/categories.jpeg` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Categories | Grails`,
    description: `Browse all ENS categories on Grails`,
    images: `https://grails.app/banners/categories.jpeg`,
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
