import { Metadata } from 'next'
import Categories from './components/categories'

export const metadata: Metadata = {
  title: `Categories`,
  description: `Browse all categories on Grails`,
  openGraph: {
    title: `Categories | Grails`,
    siteName: `Categories`,
    description: `Browse all ENS categories on Grails`,
    url: `https://grails.app/categories`,
    images: [{ url: `https://grails.app/previews/categories.jpeg` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Categories | Grails`,
    description: `Browse all ENS categories on Grails`,
    images: `https://grails.app/previews/categories.jpeg`,
  },
}

const UserPage = () => {
  return (
    <main className='md:p-lg p-md min-h-[calc(100dvh-52px)] w-full md:min-h-[calc(100dvh-70px)]'>
      <Categories />
    </main>
  )
}

export default UserPage
