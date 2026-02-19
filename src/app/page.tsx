import Footer from '@/components/footer'
import BulkTools from '@/components/home/bulkTools'
import DisplayedCards from '@/components/home/displayedCard'
import HeroSearch from '@/components/home/heroSearch'
import RecentContainer from '@/components/home/recent-container'
import TopCategories from '@/components/home/topCategories'
import TwitterBot from '@/components/home/twitterBot'
import AnimateIn from '@/components/ui/animateIn'

const Home = () => {
  return (
    <main className='relative max-w-screen overflow-hidden'>
      <div className='z-10 mx-auto flex h-full w-full max-w-[1296px] flex-col items-center gap-4 md:gap-12 pt-14 lg:pt-8 '>
        <AnimateIn className='flex w-full flex-col items-center justify-center lg:flex-row lg:items-start lg:justify-start xl:gap-0 px-4 md:px-8 xl:px-4'>
          <div className='flex w-full flex-col items-center justify-center gap-2'>
            <h1 className='font-sedan-sc text-center text-4xl sm:text-7xl xl:text-9xl'>ENS Manager & Market</h1>
            <p className='xs:text-xl mb-2 text-center text-lg font-medium sm:mb-4 md:text-2xl'>
              0% Market Fees — Bulk Tools — Open Source{' '}
            </p>
            <HeroSearch />
          </div>
        </AnimateIn>
        <DisplayedCards />
        <div className='flex flex-col items-center justify-center gap-12 sm:gap-20 md:gap-28 max-w-full px-4 md:px-8 xl:px-4'>
          <RecentContainer />
          <BulkTools />
          <TopCategories />
          <TwitterBot />
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default Home
