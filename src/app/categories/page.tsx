import { Metadata } from 'next'
import { FilterProvider } from '@/context/filters'
import MainPanel from './components/MainPanel'
import { Suspense } from 'react'

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

const CategoriesPage = () => {
  return (
    <Suspense>
      <FilterProvider filterType='categoriesPage'>
        <main className='min-h-[calc(100dvh-52px)] w-full md:min-h-[calc(100dvh-70px)]'>
          <MainPanel />
        </main>
      </FilterProvider>
    </Suspense>
  )
}

export default CategoriesPage
