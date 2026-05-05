import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import CategoryPage from './components/category'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

interface Props {
  params: Promise<{ category: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const category = params.category

  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category

  return {
    title: `${categoryLabel} Category`,
    description: `${categoryLabel} Category on Grails Marketplace`,
    openGraph: {
      title: `${categoryLabel} Category | Grails`,
      siteName: `${categoryLabel} Category`,
      description: `${categoryLabel} Category on Grails Marketplace`,
      url: `https://grails.app/categories/${category}`,
      images: [{ url: `https://grails.app/api/og/category?category=${category}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryLabel} Category | Grails`,
      description: `${categoryLabel} Category on Grails Marketplace`,
      images: `https://grails.app/api/og/category?category=${category}`,
    },
  }
}

const UserPage = async (props: Props) => {
  const { category } = await props.params

  return (
    <main className='w-full'>
      <CategoryPage category={category} />
    </main>
  )
}

export default UserPage
