import Footer from '@/components/footer'
import BulkTools from '@/components/home/bulkTools'
import DisplayedCards from '@/components/home/displayedCard'
import HeroSearch from '@/components/home/heroSearch'
import RecentContainer from '@/components/home/recent-container'
import TopCategories from '@/components/home/topCategories'
import TwitterBot from '@/components/home/twitterBot'

const Home = () => {
  return (
    <main className='relative'>
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
      <div className='z-10 mx-auto flex h-full w-full max-w-[1296px] flex-col items-center gap-12 px-4 pt-14 sm:gap-20 md:gap-28 md:px-8 lg:pt-8 xl:px-4'>
        <div className='flex w-full flex-col items-center justify-center gap-32 md:gap-24 lg:flex-row lg:items-start lg:justify-start xl:gap-0'>
          <div className='flex w-full flex-col items-center justify-center gap-2'>
            <h1 className='font-sedan-sc text-center text-4xl sm:text-7xl xl:text-9xl'>ENS Manager & Market</h1>
            <p className='xs:text-xl mb-2 text-center text-lg font-medium sm:mb-4 md:text-2xl'>
              0% Market Fees — Bulk Tools — Open Source{' '}
            </p>
            <HeroSearch />
          </div>
        </div>
        <DisplayedCards />
        <RecentContainer />
        <BulkTools />
        <TopCategories />
        <TwitterBot />
      </div>
      <Footer />
    </main>
  )
}

export default Home
