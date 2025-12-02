import type { Metadata } from 'next'
import type { SearchParams } from 'next/dist/server/request/search-params'
import NamePage from './components/name'
import { beautifyName } from '@/lib/ens'

interface Props {
  params: Promise<{ name: string }>
  searchParams: Promise<SearchParams>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const name = beautifyName(decodeURI(params.name))

  return {
    title: `${name}`,
    description: `${name}`,
    openGraph: {
      title: `${name}`,
      siteName: `${name}`,
      description: `${name}`,
      url: `https://grails.app/${name}`,
      images: [{ url: `https://grails.app/api/og/name?name=${name}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}`,
      description: `${name}`,
      images: `https://grails.app/api/og/name?name=${name}`,
    },
  }
}

const Name = async (props: Props) => {
  const { name } = await props.params
  const decodedName = decodeURI(name)

  return (
    <main className='min-h-[calc(100dvh-56px)] w-full sm:px-4 md:min-h-[calc(100dvh-78px)]'>
      <NamePage name={decodedName} />
    </main>
  )
}

export default Name
