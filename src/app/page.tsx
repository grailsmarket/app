import Footer from '@/components/footer'
import BulkTools from '@/components/home/bulkTools'
import CommentFeed from '@/components/home/commentFeed'
import DisplayedCards from '@/components/home/displayedCard'
import FrequentlyAskedQuestions from '@/components/home/frequentlyAskedQuestions'
import HeroSearch from '@/components/home/heroSearch'
import RecentContainer from '@/components/home/recent-container'
import Testemonials from '@/components/home/testemonials'
import TopCategories from '@/components/home/topCategories'
import TwitterBot from '@/components/home/twitterBot'
import AnimateIn from '@/components/ui/animateIn'

const Home = () => {
  return (
    <main className='relative max-w-screen overflow-hidden'>
      <div className='z-10 mx-auto flex h-full w-full max-w-[1296px] flex-col items-center gap-4 pt-14 @[48rem]/app:gap-12 @[64rem]/app:pt-8'>
        <AnimateIn className='flex w-full flex-col items-center justify-center px-4 @[48rem]/app:px-8 @[64rem]/app:flex-row @[64rem]/app:items-start @[64rem]/app:justify-start @[80rem]/app:gap-0 @[80rem]/app:px-4'>
          <div className='flex w-full flex-col items-center justify-center gap-2'>
            <h1 className='font-sedan-sc text-center text-4xl @[40rem]/app:text-7xl @[80rem]/app:text-9xl'>
              ENS Manager & Market
            </h1>
            <p className='mb-2 text-center text-lg font-medium @[26.25rem]/app:text-xl @[40rem]/app:mb-4 @[48rem]/app:text-2xl'>
              0% Market Fees — Bulk Tools — Open Source{' '}
            </p>
            <HeroSearch />
          </div>
        </AnimateIn>
        <DisplayedCards />
        <div className='flex max-w-full flex-col items-center justify-center gap-12 px-4 @[40rem]/app:gap-20 @[48rem]/app:gap-28 @[48rem]/app:px-8 @[80rem]/app:px-4'>
          <RecentContainer />
          <CommentFeed />
          <Testemonials />
          <BulkTools />
          <TopCategories />
          <TwitterBot />
          <FrequentlyAskedQuestions />
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default Home
