import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import NamePage from './components/name'

interface Props {
  params: Promise<{ name: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const name = params.name

  return {
    title: `${name} | Grails`,
    description: `${name}`,
    openGraph: {
      title: `${name} | Grails`,
      siteName: `${name} | Grails`,
      description: `${name}`,
      url: `https://grails.app/names/${name}`,
      images: [{ url: `https://grails.app/names/og?name=${name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}`,
      description: `${name}`,
      images: `https://grails.app/names/og?name=${name}`,
    },
  }
}

const Name = async (props: Props) => {
  const { name } = await props.params

  return (
    <main className='min-h-screen w-full px-4' style={{ minHeight: 'calc(100vh - 360px)' }}>
      <NamePage name={name} />
    </main>
  )
}

export default Name
