import FilterPanel from '@/components/filters'
import Image from 'next/image'
import heroBackground from 'public/art/wallpapper-left.svg'
import heroBackgroundRight from 'public/art/wallpapper-right.svg'
import DomainPanel from './components/domainPanel'

const Marketplace = () => {
  return (
    <main className='relative px-4'>
      <div className='absolute z-0 top-0 left-0 w-screen h-full flex items-center justify-between -translate-y-56'>
        <Image src={heroBackground} alt='hero-background' className='object-cover -translate-x-12' width={400} height={900} />
        <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
      </div>
      <div className='mx-auto pt-24 relative z-10 flex flex-col gap-32 w-full'>
        <div className='flex flex-row gap-4 p-lg max-h-[90vh] w-full overflow-hidden rounded-lg bg-background border-2 border-primary'>
          <FilterPanel />
          <DomainPanel />
        </div>
      </div>
    </main>
  )
}

export default Marketplace