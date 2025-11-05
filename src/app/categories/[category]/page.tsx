import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
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
  const queryClient = new QueryClient()

  return (
    <main className='min-h-screen w-full' style={{ minHeight: 'calc(100vh - 360px)' }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CategoryPage category={category} />
      </HydrationBoundary>
    </main>
  )
}

export default UserPage
