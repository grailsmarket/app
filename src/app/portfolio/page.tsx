'use client'

import FilterPanel from '@/components/filters'
import Image from 'next/image'
import heroBackground from 'public/art/wallpapper-left.svg'
import heroBackgroundRight from 'public/art/wallpapper-right.svg'
import DomainPanel from './components/domainPanel'
import ActionButtons from './components/actionButtons'
import { FilterProvider } from '@/context/filters'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'

const Portfolio = () => {
  const { selectedTab } = useAppSelector(selectUserProfile)

  return (
    <FilterProvider filterType='portfolio' portfolioTab={selectedTab.value}>
      <main className='relative md:px-4'>
        <div className='absolute top-0 left-0 z-0 flex h-full w-screen -translate-y-56 items-center justify-between'>
          <Image
            src={heroBackground}
            alt='hero-background'
            className='-translate-x-12 object-cover'
            width={400}
            height={900}
          />
          <Image src={heroBackgroundRight} alt='hero-background' className='object-cover' width={600} height={1200} />
        </div>
        <div className='relative z-10 mx-auto flex w-full flex-col gap-32 pt-24'>
          <div className='px-lg max-w-domain-panel lg:p-lg bg-background border-primary relative mx-auto flex h-[calc(100vh-96px)] w-full flex-row gap-4 overflow-hidden rounded-t-sm border-t-2 pb-0! md:h-[90vh] md:rounded-lg md:border-2'>
            <FilterPanel />
            <DomainPanel />
            <ActionButtons />
          </div>
        </div>
      </main>
    </FilterProvider>
  )
}

export default Portfolio
