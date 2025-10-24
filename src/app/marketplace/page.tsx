import FilterPanel from '@/components/filters'
import DomainPanel from './components/domainPanel'
import ActionButtons from './components/actionButtons'
import { FilterProvider } from '@/context/filters'

const Marketplace = () => {
  return (
    <FilterProvider filterType='marketplace'>
      <main className='relative md:px-4'>
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
        <div className='relative z-10 mx-auto flex w-full flex-col gap-32 pt-24'>
          <div className='px-lg lg:p-lg max-w-domain-panel bg-background border-primary relative mx-auto flex h-[calc(100vh-96px)] w-full flex-row gap-4 overflow-hidden rounded-t-sm border-t-2 md:h-[calc(100vh-110px)] md:rounded-lg md:border-2'>
            <FilterPanel />
            <DomainPanel />
            <ActionButtons />
          </div>
        </div>
      </main>
    </FilterProvider>
  )
}

export default Marketplace
