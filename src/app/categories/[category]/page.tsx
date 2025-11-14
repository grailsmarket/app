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

  const categoryLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]

  return {
    title: `${categoryLabel} Category | Grails`,
    description: `${categoryLabel}`,
    openGraph: {
      title: `${categoryLabel} Category | Grails`,
      siteName: `${categoryLabel} Category | Grails`,
      description: `${categoryLabel}`,
      url: `https://grails.app/categories/${category}`,
      images: [{ url: `https://grails.app/categories/og?category=${category}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${categoryLabel}`,
      description: `${categoryLabel}`,
      images: `https://grails.app/categories/og?category=${category}`,
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
