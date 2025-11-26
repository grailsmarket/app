import { Suspense } from 'react'
import FilterPanel from '@/components/filters'
import DomainPanel from './components/domainPanel'
import { FilterProvider } from '@/context/filters'
import ActionButtons from './components/actionButtons'

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
          <div className='relative z-10 mx-auto flex w-full flex-col pt-14 md:pt-18'>
            <div className='px-md bg-background relative mx-auto flex h-[calc(100dvh-52px)] max-h-[calc(100dvh-56px)] w-full flex-row gap-0 overflow-hidden pl-[5px] sm:px-3 md:h-[calc(100dvh-70px)] md:max-h-[calc(100dvh-70px)] lg:gap-2 lg:px-0 lg:pl-2'>
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
