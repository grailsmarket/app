import { Suspense } from 'react'
import FilterPanel from '@/components/filters'
import DomainPanel from './components/domainPanel'
import { FilterProvider } from '@/context/filters'
import ActionButtons from './components/actionButtons'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Find your next Grail on the Grails ENS Market',
  openGraph: {
    title: 'Marketplace | Grails',
    description: 'Find your next Grail on the Grails ENS Market',
    siteName: 'Marketplace',
    url: 'https://grails.app/marketplace',
    images: [{ url: 'https://grails.app/previews/marketplace.jpeg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace | Grails',
    description: 'Find your next Grail on the Grails ENS Market',
    images: 'https://grails.app/previews/marketplace.jpeg',
  },
}

const Marketplace = () => {
  return (
    <Suspense>
      <FilterProvider filterType='marketplace'>
        <main className='max-h-[100dvh]! overflow-hidden'>
          {/* <div className='absolute top-0 left-0 z-0 flex h-full w-screen -translate-y-56 items-center justify-between'>
          <Image
            src={heroBackground}
            alt='hero-background'
            className='-translate-x-12 object-cover'
            width={400}
            height={900}
          />
          <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
        </div> */}
          <div className='relative z-10 mx-auto flex w-full flex-col'>
            <div className='px-md bg-background sm:px-md relative mx-auto flex h-[calc(100dvh-52px)] max-h-[calc(100dvh-56px)] w-full flex-row gap-0 overflow-hidden pl-[5px] md:h-[calc(100dvh-70px)] md:max-h-[calc(100dvh-70px)] lg:gap-2 lg:px-0 lg:pl-2'>
              <FilterPanel />
              <div className='bg-tertiary hidden h-full w-0.5 lg:block' />
              <DomainPanel />
              <ActionButtons />
            </div>
          </div>
        </main>
      </FilterProvider>
    </Suspense>
  )
}

export default Marketplace
